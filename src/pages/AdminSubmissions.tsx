
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

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const response = await fetch(
          'http://localhost:8000/api/submissions/pending',
          { credentials: 'include' }
        )

        if (!response.ok) {
          throw new Error('신청 목록을 불러오지 못했습니다.')
        }

        const data = await response.json()
        setSubmissions(data.submissions)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '오류가 발생했습니다.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [])

  return (
    <main className="admin-submissions">
      <h1>장소 등록 심사</h1>
      <p>회원이 신청한 장소를 검토하는 관리자 페이지입니다.</p>

      {loading && <p>신청 목록을 불러오는 중...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && submissions.length === 0 && (
        <p>현재 승인 대기 중인 장소가 없습니다.</p>
      )}

      {submissions.map((submission) => (
        <article key={submission.id} className="auth-card">
          <h2>{submission.name_ko}</h2>
          <p>중국어 이름: {submission.name_zh}</p>
          <p>카테고리: {submission.category}</p>
          <p>지역: {submission.district}</p>
          <p>주소: {submission.address_zh}</p>
          <p>설명: {submission.description || '없음'}</p>
          <p>추천 이유: {submission.recommendation || '없음'}</p>
          <p>신청자: {submission.submitted_by}</p>
          <p>신청 번호: {submission.id}</p>

<button
  type="button"
  onClick={async () => {
    const confirmed = window.confirm(
      `${submission.name_ko} 장소를 승인하시겠습니까?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `http://localhost:8000/api/submissions/${submission.id}/approve`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || '승인에 실패했습니다.')
      }

      setSubmissions((previous) =>
        previous.filter((item) => item.id !== submission.id)
      )

      alert('장소 등록 신청이 승인되었습니다.')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : '승인 처리 중 오류가 발생했습니다.'
      )
    }
  }}
>
  승인하기
</button>

<button
  type="button"
  onClick={async () => {
    const reason = window.prompt(
      `${submission.name_ko} 장소의 반려 사유를 입력해 주세요.`
    )

    if (reason === null) return

    if (!reason.trim()) {
      alert('반려 사유를 입력해야 합니다.')
      return
    }

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
            reason: reason.trim(),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : '반려에 실패했습니다.'
        )
      }

      setSubmissions((previous) =>
        previous.filter((item) => item.id !== submission.id)
      )

      alert('장소 등록 신청이 반려되었습니다.')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : '반려 처리 중 오류가 발생했습니다.'
      )
    }
  }}
>
  반려하기
</button>



        </article>
      ))}
    </main>
  )
}
