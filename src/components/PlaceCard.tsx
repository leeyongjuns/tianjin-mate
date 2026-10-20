import type { Place } from '../types/place'

interface PlaceCardProps {
  place: Place
  onSelect: (place: Place) => void
}

function PlaceCard({ place, onSelect }: PlaceCardProps) {
  return (
    <article className="place-card">
      <div className="place-card-top">
        <span className="place-category">
          {place.category}
        </span>

        <span className="place-district">
          {place.district}
        </span>
      </div>

      <h3>{place.nameKo}</h3>

      <p className="place-chinese">{place.nameZh}</p>

      <p className="place-description">
        {place.description}
      </p>

      <div className="place-card-bottom">
        <span>{place.addressZh}</span>

        <button
          type="button"
          onClick={() => onSelect(place)}
        >
          상세 보기 →
        </button>
      </div>
    </article>
  )
}

export default PlaceCard