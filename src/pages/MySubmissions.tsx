
import { useEffect, useState } from 'react'

type Submission = {
  id: number
  name_ko: string
  name_zh: string
  category: string
  district: string
  address_zh: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
}

type Props = {
  onBack: () => void
}

const statusLabels = {
  pending: '심사 대기',
  approved: '승인 완료',
  rejected: '반려 완료',
}

export default function MySubmissions({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadSubmissions() {
      try {
        const response = await fetch(
          'http://localhost:8000/api/submissions/mine',
          {
            credentials: 'include',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('신청 내역을 불러오지 못했습니다.')
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
  }, [])

  return (
    <section className="section my-submissions">
      <div className="section-heading">
        <h2>내 신청 내역</h2>
        <p>내가 등록 신청한 장소의 심사 결과를 확인할 수 있습니다.</p>
      </div>

      <button type="button" className="auth-back" onClick={onBack}>
        ← 홈으로 돌아가기
      </button>

      {loading && <p>신청 내역을 불러오는 중...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && submissions.length === 0 && (
        <p>아직 등록 신청한 장소가 없습니다.</p>
      )}

      {!loading && !error && submissions.map((submission) => (
        <article key={submission.id} className="auth-card">
          <h3>{submission.name_ko}</h3>
          <p>중국어 이름: {submission.name_zh}</p>
          <p>카테고리: {submission.category}</p>
          <p>지역: {submission.district}</p>
          <p>주소: {submission.address_zh}</p>
          <p>
            심사 상태: <strong>{statusLabels[submission.status]}</strong>
          </p>
          <p>
            신청일: {new Date(submission.created_at).toLocaleString('ko-KR')}
          </p>

          {submission.reviewed_at && (
            <p>
              심사일: {new Date(submission.reviewed_at).toLocaleString('ko-KR')}
            </p>
          )}

          {submission.status === 'rejected' && (
            <p>
              반려 사유: {submission.rejection_reason || '사유 없음'}
            </p>
          )}
        </article>
      ))}
    </section>
  )
}
