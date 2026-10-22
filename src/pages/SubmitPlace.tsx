
import { useState } from 'react'

type SubmitPlaceProps = {
    onBack: () => void
    onViewMySubmissions: () => void
  }

const categories = [
  '맛집', '카페', '병원', '마트',
  '학교', '관광', '교통', '주거', '기타',
]

const districts = [
  '和平区', '河西区', '南开区', '河东区',
  '河北区', '红桥区', '西青区', '津南区',
  '北辰区', '东丽区', '滨海新区', '其他',
]

function SubmitPlace({
    onBack,
    onViewMySubmissions,
  }: SubmitPlaceProps) {
  const [nameKo, setNameKo] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [category, setCategory] = useState('맛집')
  const [district, setDistrict] = useState('南开区')
  const [addressZh, setAddressZh] = useState('')
  const [description, setDescription] = useState('')
  const [recommendation, setRecommendation] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8000/api/submissions',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name_ko: nameKo.trim(),
            name_zh: nameZh.trim(),
            category,
            district,
            address_zh: addressZh.trim(),
            description: description.trim(),
            recommendation: recommendation.trim() || null,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()

        throw new Error(
          response.status === 401
            ? '로그인이 필요합니다. 다시 로그인해 주세요.'
            : typeof data.detail === 'string'
              ? data.detail
              : '장소 등록 신청에 실패했습니다.'
        )
      }

      const result = await response.json()

      setSuccess(
        `장소 등록 신청이 완료되었습니다!\n` +
        `신청 번호: ${result.submission_id}\n` +
        `관리자가 24시간 이내 심사를 목표로 검토합니다.\n` +
        `승인되면 Tianjin Mate 장소 목록에 공개됩니다.`
      )

      setNameKo('')
      setNameZh('')
      setAddressZh('')
      setDescription('')
      setRecommendation('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '서버 연결에 실패했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <button
          type="button"
          className="auth-back"
          onClick={onBack}
        >
          ← 홈으로
        </button>

        <h1>새 장소 등록 신청</h1>
        <p>
          알고 있는 천진의 좋은 장소를 공유해 주세요.
          관리자 승인 후 장소 목록에 공개됩니다.
        </p>

        
{success && (
  <div className="submission-success" role="status">
    <span className="submission-success-icon">✓</span>
    <p>{success}</p>

    <button
      type="button"
      className="auth-submit"
      onClick={onViewMySubmissions}
    >
      내 신청 내역 확인하기 →
    </button>
  </div>
)}


        <form onSubmit={handleSubmit}>
          <label htmlFor="place-name-ko">
            한국어 장소 이름
          </label>
          <input
            id="place-name-ko"
            value={nameKo}
            onChange={(e) => setNameKo(e.target.value)}
            maxLength={200}
            required
          />

          <label htmlFor="place-name-zh">
            중국어 장소 이름
          </label>
          <input
            id="place-name-zh"
            value={nameZh}
            onChange={(e) => setNameZh(e.target.value)}
            maxLength={200}
            required
          />

          <label htmlFor="place-category">
            카테고리
          </label>
          <select
            id="place-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="place-district">
            지역
          </label>
          <select
            id="place-district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="place-address">
            중국어 주소
          </label>
          <input
            id="place-address"
            value={addressZh}
            onChange={(e) => setAddressZh(e.target.value)}
            maxLength={1000}
            placeholder="天津市南开区..."
            required
          />

          <label htmlFor="place-description">
            장소 설명
          </label>
          <textarea
            id="place-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={3000}
            rows={4}
            required
          />

          <label htmlFor="place-recommendation">
            추천 이유 (선택)
          </label>
          <textarea
            id="place-recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            maxLength={3000}
            rows={3}
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? '신청 중...' : '장소 등록 신청하기'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default SubmitPlace
