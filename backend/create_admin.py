
import getpass
import os

import psycopg
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def create_admin():
    print("=== Tianjin Mate 관리자 계정 생성 ===")

    username = input("관리자 아이디: ").strip()

    if not username or len(username) > 100:
        print("아이디는 1~100자로 입력해 주세요.")
        return

    password = getpass.getpass("관리자 비밀번호: ")
    confirm = getpass.getpass("비밀번호 확인: ")

    if password != confirm:
        print("비밀번호가 일치하지 않습니다.")
        return

    if len(password) < 12:
        print("비밀번호는 최소 12자 이상이어야 합니다.")
        return

    hashed_password = password_hash.hash(password)

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
                    INSERT INTO admin_users
                        (username, password_hash)
                    VALUES (%s, %s)
                    ON CONFLICT (username) DO NOTHING
                    RETURNING id
                    """,
                    (username, hashed_password),
                )

                result = cursor.fetchone()

                if result is None:
                    print("이미 존재하는 관리자 아이디입니다.")
                    return

        print("관리자 계정이 생성되었습니다!")

    except psycopg.Error:
        print("DB 오류가 발생했습니다. 연결 설정을 확인해 주세요.")


if __name__ == "__main__":
    create_admin()
