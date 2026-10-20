
import getpass
import os

import psycopg
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

router = APIRouter(prefix="/api/users", tags=["Users"])

password_hash = PasswordHash.recommended()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    nickname: str = Field(min_length=2, max_length=100)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(data: RegisterRequest):
    hashed_password = password_hash.hash(data.password)

    try:
        with psycopg.connect(
            host="localhost",
            port=5432,
            dbname="tianjin_mate",
            user=os.getenv("PGUSER", getpass.getuser()),
            password=os.getenv("PGPASSWORD") or None,
        ) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO users (
                        username,
                        email,
                        password_hash,
                        nickname,
                        role
                    )
                    VALUES (%s, %s, %s, %s, 'user')
                    ON CONFLICT DO NOTHING
                    RETURNING id
                    """,
                    (
                        data.username,
                        str(data.email),
                        hashed_password,
                        data.nickname,
                    ),
                )

                result = cursor.fetchone()

                if result is None:
                    raise HTTPException(
                        status_code=409,
                        detail="이미 사용 중인 아이디 또는 이메일입니다.",
                    )

                new_user_id = result[0]

        return {
            "message": "회원가입이 완료되었습니다.",
            "user": {
                "id": new_user_id,
                "username": data.username,
                "nickname": data.nickname,
                "role": "user",
            },
        }

    except HTTPException:
        raise

    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="회원가입 처리 중 오류가 발생했습니다.",
        )
