
import os
import getpass

import psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.users import router as users_router
from app.auth import router as auth_router
from app.submissions import router as submissions_router

app = FastAPI(
    title="Tianjin Mate API",
    description="천진 한국인 생활 플랫폼 백엔드",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(submissions_router)

def get_connection():
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname="tianjin_mate",
        user=os.getenv("PGUSER", getpass.getuser()),
        password=os.getenv("PGPASSWORD") or None,
        row_factory=dict_row,
    )


@app.get("/")
def home():
    return {"message": "Tianjin Mate API is running!"}


@app.get("/api/places")
def get_places():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        id,
                        name_ko AS "nameKo",
                        name_zh AS "nameZh",
                        category,
                        district,
                        address_zh AS "addressZh",
                        description
                    FROM places
                    ORDER BY id
                """)

                return cursor.fetchall()

    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="데이터베이스 조회에 실패했습니다.",
        )
