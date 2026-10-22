
import getpass
import hashlib
import os

import psycopg
from psycopg.rows import dict_row
from fastapi import APIRouter, Cookie, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/submissions",
    tags=["Place Submissions"],
)


def get_connection():
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname="tianjin_mate",
        user=os.getenv("PGUSER", getpass.getuser()),
        password=os.getenv("PGPASSWORD") or None,
        row_factory=dict_row,
    )


class PlaceSubmissionRequest(BaseModel):
    name_ko: str = Field(min_length=1, max_length=200)
    name_zh: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=50)
    district: str = Field(min_length=1, max_length=50)
    address_zh: str = Field(min_length=1, max_length=1000)
    description: str = Field(min_length=1, max_length=3000)
    recommendation: str | None = Field(
        default=None,
        max_length=3000,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_submission(
    data: PlaceSubmissionRequest,
    tm_session: str | None = Cookie(default=None),
):
    # 로그인하지 않은 사용자는 등록할 수 없음
    if not tm_session:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다.",
        )

    token_hash = hashlib.sha256(
        tm_session.encode("utf-8")
    ).hexdigest()

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 로그인 세션으로 실제 회원 ID 조회
                cursor.execute(
                    """
                    SELECT u.id
                    FROM user_sessions s
                    JOIN users u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.expires_at > NOW()
                      AND u.is_active = TRUE
                    """,
                    (token_hash,),
                )

                user = cursor.fetchone()

                if user is None:
                    raise HTTPException(
                        status_code=401,
                        detail="로그인 세션이 유효하지 않습니다.",
                    )

                # 장소 신청 정보를 승인 대기로 저장
                cursor.execute(
                    """
                    INSERT INTO place_submissions (
                        user_id,
                        name_ko,
                        name_zh,
                        category,
                        district,
                        address_zh,
                        description,
                        recommendation,
                        status
                    )
                    VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, 'pending'
                    )
                    RETURNING id
                    """,
                    (
                        user["id"],
                        data.name_ko,
                        data.name_zh,
                        data.category,
                        data.district,
                        data.address_zh,
                        data.description,
                        data.recommendation,
                    ),
                )

                result = cursor.fetchone()
                submission_id = result["id"]

        return {
            "message": "장소 등록 신청이 완료되었습니다.",
            "submission_id": submission_id,
            "status": "pending",
        }

    except HTTPException:
        raise

    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="장소 등록 신청 중 오류가 발생했습니다.",
        )

@router.get("/pending")
def get_pending_submissions(
    tm_session: str | None = Cookie(default=None),
):
    if not tm_session:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다.",
        )

    token_hash = hashlib.sha256(
        tm_session.encode("utf-8")
    ).hexdigest()

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 서버에서 관리자 권한 확인
                cursor.execute(
                    """
                    SELECT u.id, u.role
                    FROM user_sessions s
                    JOIN users u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.expires_at > NOW()
                      AND u.is_active = TRUE
                    """,
                    (token_hash,),
                )

                user = cursor.fetchone()

                if user is None:
                    raise HTTPException(
                        status_code=401,
                        detail="로그인 세션이 유효하지 않습니다.",
                    )

                if user["role"] != "admin":
                    raise HTTPException(
                        status_code=403,
                        detail="관리자 권한이 필요합니다.",
                    )

                # 승인 대기 중인 장소만 조회
                cursor.execute(
                    """
                    SELECT
                        ps.id,
                        ps.name_ko,
                        ps.name_zh,
                        ps.category,
                        ps.district,
                        ps.address_zh,
                        ps.description,
                        ps.recommendation,
                        ps.created_at,
                        u.username AS submitted_by
                    FROM place_submissions ps
                    JOIN users u ON u.id = ps.user_id
                    WHERE ps.status = 'pending'
                    ORDER BY ps.created_at ASC, ps.id ASC
                    """
                )

                submissions = cursor.fetchall()

        return {"submissions": submissions}

    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="승인 대기 목록 조회에 실패했습니다.",
        )

@router.post("/{submission_id}/approve")
def approve_submission(
    submission_id: int,
    tm_session: str | None = Cookie(default=None),
):
    if not tm_session:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다.",
        )

    token_hash = hashlib.sha256(
        tm_session.encode("utf-8")
    ).hexdigest()

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 1. 관리자 권한 확인
                cursor.execute(
                    """
                    SELECT u.id, u.role
                    FROM user_sessions s
                    JOIN users u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.expires_at > NOW()
                      AND u.is_active = TRUE
                    """,
                    (token_hash,),
                )

                admin = cursor.fetchone()

                if admin is None:
                    raise HTTPException(
                        status_code=401,
                        detail="로그인 세션이 유효하지 않습니다.",
                    )

                if admin["role"] != "admin":
                    raise HTTPException(
                        status_code=403,
                        detail="관리자 권한이 필요합니다.",
                    )

                # 2. 신청 정보 잠금 및 조회
                cursor.execute(
                    """
                    SELECT *
                    FROM place_submissions
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (submission_id,),
                )

                submission = cursor.fetchone()

                if submission is None:
                    raise HTTPException(
                        status_code=404,
                        detail="신청 내역을 찾을 수 없습니다.",
                    )

                if submission["status"] != "pending":
                    raise HTTPException(
                        status_code=409,
                        detail="이미 처리된 신청입니다.",
                    )

                # 3. 승인된 장소를 공개 목록에 등록
                cursor.execute(
                    """
                    INSERT INTO places (
                        name_ko,
                        name_zh,
                        category,
                        district,
                        address_zh,
                        description,
                        recommendation
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        submission["name_ko"],
                        submission["name_zh"],
                        submission["category"],
                        submission["district"],
                        submission["address_zh"],
                        submission["description"],
                        submission["recommendation"],
                    ),
                )

                place = cursor.fetchone()

                # 4. 신청 상태를 승인 완료로 변경
                cursor.execute(
                    """
                    UPDATE place_submissions
                    SET status = 'approved',
                        reviewed_by = %s,
                        reviewed_at = NOW()
                    WHERE id = %s
                    """,
                    (admin["id"], submission_id),
                )

        return {
            "message": "장소 등록 신청이 승인되었습니다.",
            "submission_id": submission_id,
            "place_id": place["id"],
            "status": "approved",
        }

    except HTTPException:
        raise

    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="장소 승인 처리 중 오류가 발생했습니다.",
        )


class RejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


@router.post("/{submission_id}/reject")
def reject_submission(
    submission_id: int,
    data: RejectRequest,
    tm_session: str | None = Cookie(default=None),
):
    if not tm_session:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다.",
        )

    token_hash = hashlib.sha256(
        tm_session.encode("utf-8")
    ).hexdigest()

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 관리자 권한 확인
                cursor.execute(
                    """
                    SELECT u.id, u.role
                    FROM user_sessions s
                    JOIN users u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.expires_at > NOW()
                      AND u.is_active = TRUE
                    """,
                    (token_hash,),
                )

                admin = cursor.fetchone()

                if admin is None:
                    raise HTTPException(
                        status_code=401,
                        detail="로그인 세션이 유효하지 않습니다.",
                    )

                if admin["role"] != "admin":
                    raise HTTPException(
                        status_code=403,
                        detail="관리자 권한이 필요합니다.",
                    )

                # 아직 심사되지 않은 신청만 반려
                cursor.execute(
                    """
                    UPDATE place_submissions
                    SET status = 'rejected',
                        reviewed_by = %s,
                        rejection_reason = %s,
                        reviewed_at = NOW()
                    WHERE id = %s
                      AND status = 'pending'
                    RETURNING id
                    """,
                    (
                        admin["id"],
                        data.reason.strip(),
                        submission_id,
                    ),
                )

                result = cursor.fetchone()

                if result is None:
                    raise HTTPException(
                        status_code=409,
                        detail="신청이 없거나 이미 처리되었습니다.",
                    )

        return {
            "message": "장소 등록 신청이 반려되었습니다.",
            "submission_id": submission_id,
            "status": "rejected",
        }

    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=500,
            detail="장소 반려 처리 중 오류가 발생했습니다.",
        )

@router.get("/mine")
def get_my_submissions(
    tm_session: str | None = Cookie(default=None),
):
    if not tm_session:
        raise HTTPException(
            status_code=401,
            detail="로그인이 필요합니다.",
        )

    token_hash = hashlib.sha256(
        tm_session.encode("utf-8")
    ).hexdigest()

    with get_connection() as conn:
        with conn.cursor() as cursor:
            # 로그인한 회원 확인
            cursor.execute(
                """
                SELECT u.id
                FROM user_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = %s
                  AND s.expires_at > NOW()
                  AND u.is_active = TRUE
                """,
                (token_hash,),
            )

            user = cursor.fetchone()

            if user is None:
                raise HTTPException(
                    status_code=401,
                    detail="로그인 세션이 유효하지 않습니다.",
                )

            # 해당 회원이 신청한 장소만 조회
            cursor.execute(
                """
                SELECT
                    id,
                    name_ko,
                    name_zh,
                    category,
                    district,
                    address_zh,
                    status,
                    rejection_reason,
                    created_at,
                    reviewed_at
                FROM place_submissions
                WHERE user_id = %s
                ORDER BY created_at DESC, id DESC
                """,
                (user["id"],),
            )

            submissions = cursor.fetchall()

    return {"submissions": submissions}
