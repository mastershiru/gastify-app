import jwt
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)

bearer_scheme = HTTPBearer(
    auto_error=False,
)


def create_credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = (
        create_credentials_exception()
    )

    if credentials is None:
        raise credentials_exception

    if credentials.scheme.lower() != "bearer":
        raise credentials_exception

    try:
        token_payload = decode_token(
            credentials.credentials
        )
    except jwt.PyJWTError as exc:
        raise credentials_exception from exc

    if token_payload.get("type") != "access":
        raise credentials_exception

    subject = token_payload.get("sub")

    if not isinstance(subject, str):
        raise credentials_exception

    try:
        user_id = int(subject)
    except ValueError as exc:
        raise credentials_exception from exc

    user_result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = user_result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    existing_user_result = await db.execute(
        select(User).where(
            User.email == str(payload.email)
        )
    )

    existing_user = (
        existing_user_result.scalar_one_or_none()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    user = User(
        email=str(payload.email),
        username=payload.username,
        password_hash=hash_password(
            payload.password
        ),
    )

    db.add(user)

    try:
        await db.commit()
        await db.refresh(user)

    except IntegrityError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An account with this email "
                "already exists."
            ),
        ) from exc

    return RegisterResponse(
        message="Account created successfully.",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    user_result = await db.execute(
        select(User).where(
            User.email == str(payload.email)
        )
    )

    user = user_result.scalar_one_or_none()

    if (
        user is None
        or not verify_password(
            payload.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    subject = str(user.id)

    access_token = create_access_token(
        subject=subject,
    )

    refresh_token = create_refresh_token(
        subject=subject,
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> RefreshTokenResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        token_payload = decode_token(
            payload.refresh_token
        )
    except jwt.PyJWTError as exc:
        raise credentials_exception from exc

    if token_payload.get("type") != "refresh":
        raise credentials_exception

    subject = token_payload.get("sub")

    if not isinstance(subject, str):
        raise credentials_exception

    try:
        user_id = int(subject)
    except ValueError as exc:
        raise credentials_exception from exc

    user_result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = user_result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    access_token = create_access_token(
        subject=str(user.id),
    )

    return RefreshTokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: User = Depends(
        get_current_user
    ),
) -> UserResponse:
    return UserResponse.model_validate(
        current_user
    )