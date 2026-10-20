
import getpass
import hashlib
import os
import secrets

import psycopg
from psycopg.rows import dict_row
from fastapi import APIRouter, Cookie, HTTPException, Response
from pydantic import BaseModel
from pwdlib import PasswordHash

router = APIRouter(prefix="/api/users", tags=["Users"])

password_hash = PasswordHash.recommended()

COOKIE_NAME = "tm_session"
SESSION_SECONDS = 60 * 60 * 24 * 7  # 7일


def get_connection():
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname="tianjin_mate",
        user=os.getenv("PGUSER", getpass.getuser()),
        password=os.getenv("PGPASSWORD") or None,
        row_factory=dict_row,
    )


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(data: LoginRequest, response: Response):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, username, nickname, role,
                           is_active, password_hash
                    FROM users
                    WHERE username = %s
                    """,
                    (data.username,),
                )
                user = cursor.fetchone()

                if (
                    user is None
                    or not user["is_active"]
                    or not password_hash.verify(
                        data.password, user["password_hash"]
                    )
                ):
                    raise HTTPException(
                        status_code=401,
                        detail="아이디 또는 비밀번호가 올바르지 않습니다.",
                    )

                token = secrets.token_urlsafe(32)
                token_digest = hash_token(token)

                cursor.execute(
                    """
                    INSERT INTO user_sessions
                        (user_id, token_hash, expires_at)
                    VALUES
                        (%s, %s, NOW() + INTERVAL '7 days')
                    """,
                    (user["id"], token_digest),
                )

        # 로컬 HTTP 개발에서는 Secure=False,
        # HTTPS 배포 환경에서는 Secure=True 사용
        response.set_cookie(
            key=COOKIE_NAME,
            value=token,
            httponly=True,
            secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
            samesite="lax",
            max_age=SESSION_SECONDS,
            path="/",
        )

        return {
            "message": "로그인에 성공했습니다.",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "nickname": user["nickname"],
                "role": user["role"],
            },
        }

    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="로그인 처리 중 오류가 발생했습니다.",
        )


@router.get("/me")
def get_me(tm_session: str | None = Cookie(default=None)):
    if not tm_session:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다.",
        )

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.id, u.username, u.nickname, u.role
                    FROM user_sessions s
                    JOIN users u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.expires_at > NOW()
                      AND u.is_active = TRUE
                    """,
                    (hash_token(tm_session),),
                )

                user = cursor.fetchone()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="로그인 세션이 유효하지 않습니다.",
            )

        return {"user": user}

    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="사용자 정보를 조회할 수 없습니다.",
        )


@router.post("/logout")
def logout(
    response: Response,
    tm_session: str | None = Cookie(default=None),
):
    if tm_session:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        DELETE FROM user_sessions
                        WHERE token_hash = %s
                        """,
                        (hash_token(tm_session),),
                    )
        except psycopg.Error:
            raise HTTPException(
                status_code=500,
                detail="로그아웃 처리 중 오류가 발생했습니다.",
            )

    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        samesite="lax",
    )

    return {"message": "로그아웃되었습니다."}
