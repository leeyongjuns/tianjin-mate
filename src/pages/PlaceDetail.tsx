import type { Place } from '../types/place'

interface PlaceDetailProps {
  place: Place
  onBack: () => void
}

function PlaceDetail({ place, onBack }: PlaceDetailProps) {
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(place.addressZh)
      alert('중국어 주소가 복사되었습니다.')
    } catch {
      alert('주소 복사에 실패했습니다.')
    }
  }

  const openMap = () => {
    const query = encodeURIComponent(
      `${place.nameZh} ${place.addressZh}`
    )

    window.open(
      `https://uri.amap.com/search?keyword=${query}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <section className="section">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
      >
        ← 목록으로 돌아가기
      </button>

      <div className="detail-card">
        <span className="place-category">
          {place.category}
        </span>

        <h1>{place.nameKo}</h1>

        <p className="place-chinese">
          {place.nameZh} · {place.district}
        </p>

        <div className="detail-divider" />

        <h2>장소 소개</h2>
        <p>{place.description}</p>

        <h2>중국어 주소</h2>
        <p>{place.addressZh}</p>

        <div className="detail-actions">
          <button type="button" onClick={copyAddress}>
            주소 복사
          </button>

          <button type="button" onClick={openMap}>
            중국 지도에서 보기
          </button>
        </div>
      </div>
    </section>
  )
}

export default PlaceDetail