
import { useEffect, useState } from 'react'

type Submission = {
  id: number
  name_ko: string
  name_zh: string
  category: string
  district: string
  address_zh: string
  description: string | null
  recommendation: string | null
  submitted_by: string
  created_at: string
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 관리자 승인 대기 목록 불러오기
  useEffect(() => {
    const controller = new AbortController()

    async function loadSubmissions() {
      try {
        const response = await fetch(
          'http://localhost:8000/api/submissions/pending',
          {
            credentials: 'include',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('신청 목록을 불러오지 못했습니다.')
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setSubmissions(data.submissions)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : '오류가 발생했습니다.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSubmissions()

    return () => controller.abort()
}, [refreshKey])

  // API 오류 메시지 추출
  async function getErrorMessage(
    response: Response,
    fallback: string
  ): Promise<string> {
    try {
      const data = await response.json()

      return typeof data.detail === 'string'
        ? data.detail
        : fallback
    } catch {
      return fallback
    }
  }

  // 장소 승인
  async function handleApprove(submission: Submission) {
    if (processingId !== null) return

    const confirmed = window.confirm(
      `${submission.name_ko} 장소를 승인하시겠습니까?`
    )

    if (!confirmed) return

    setProcessingId(submission.id)

    try {
      const response = await fetch(
        `http://localhost:8000/api/submissions/${submission.id}/approve`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            '장소 승인에 실패했습니다.'
          )
        )
      }

      // 승인 완료된 신청을 목록에서 제거
      setSubmissions((previous) =>
        previous.filter((item) => item.id !== submission.id)
      )

      alert('장소 등록 신청이 승인되었습니다.')
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : '승인 처리 중 오류가 발생했습니다.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  // 장소 반려
  async function handleReject(submission: Submission) {
    if (processingId !== null) return

    const reason = window.prompt(
      `${submission.name_ko} 장소의 반려 사유를 입력해 주세요.`
    )

    // 입력 창에서 취소한 경우
    if (reason === null) return

    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      alert('반려 사유를 입력해야 합니다.')
      return
    }

    if (trimmedReason.length > 1000) {
      alert('반려 사유는 1000자 이하로 입력해 주세요.')
      return
    }

    setProcessingId(submission.id)

    try {
      const response = await fetch(
        `http://localhost:8000/api/submissions/${submission.id}/reject`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: trimmedReason,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            '장소 반려에 실패했습니다.'
          )
        )
      }

      // 반려 완료된 신청을 목록에서 제거
      setSubmissions((previous) =>
        previous.filter((item) => item.id !== submission.id)
      )

      alert('장소 등록 신청이 반려되었습니다.')
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : '반려 처리 중 오류가 발생했습니다.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  
return (
  <section className="admin-submissions">
    <h1>장소 등록 심사</h1>
    <p>
      회원이 신청한 장소를 검토하는 관리자 페이지입니다.
    </p>

    
<div className="admin-submissions-toolbar">
  {!loading && !error && (
    <div className="admin-submissions-count">
      승인 대기 중인 장소
      <strong>{submissions.length}건</strong>
    </div>
  )}

  <button
    type="button"
    className="admin-refresh-button"
    disabled={loading || processingId !== null}
    onClick={() => {
      setLoading(true)
      setError('')
      setRefreshKey((previous) => previous + 1)
    }}
  >
    {loading ? '불러오는 중...' : '↻ 새로고침'}
  </button>
</div>



      {loading && (
        <p>신청 목록을 불러오는 중...</p>
      )}

      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}

      
{!loading && !error && submissions.length === 0 && (
  <div className="admin-empty-state">
    <div className="admin-empty-icon">✓</div>
    <h2>모든 장소 신청을 확인했어요!</h2>
    <p>
      현재 승인 대기 중인 장소가 없습니다.
      <br />
      새로운 신청이 등록되면 이곳에서 확인할 수 있습니다.
    </p>
  </div>
)}


      {!loading && !error && submissions.map((submission) => (
        
<article
  key={submission.id}
  className="auth-card"
>
  <div className="admin-card-header">
    <div>
      <h2>{submission.name_ko}</h2>
      <span className="admin-card-name-zh">
        {submission.name_zh}
      </span>
    </div>

    <span className="admin-pending-badge">
      승인 대기
    </span>
  </div>


          
<div className="admin-card-details">
  <div className="admin-card-info-row">
    <span>카테고리</span>
    <strong>{submission.category}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>지역</span>
    <strong>{submission.district}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>주소</span>
    <strong>{submission.address_zh}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>장소 설명</span>
    <strong>{submission.description || '없음'}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>추천 이유</span>
    <strong>{submission.recommendation || '없음'}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>신청자</span>
    <strong>{submission.submitted_by}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>신청 번호</span>
    <strong>#{submission.id}</strong>
  </div>

  <div className="admin-card-info-row">
    <span>신청일</span>
    <strong>
      {new Date(submission.created_at).toLocaleString('ko-KR')}
    </strong>
  </div>
</div>


          <button
            type="button"
            disabled={processingId !== null}
            onClick={() => handleApprove(submission)}
          >
            {processingId === submission.id
              ? '처리 중...'
              : '승인하기'}
          </button>

          <button
            type="button"
            disabled={processingId !== null}
            onClick={() => handleReject(submission)}
          >
            {processingId === submission.id
              ? '처리 중...'
              : '반려하기'}
          </button>
        </article>
      ))}
    </section>
  )
}
