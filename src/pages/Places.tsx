import { useState } from 'react'
import { places } from '../data/places'
import PlaceCard from '../components/PlaceCard'

function Places() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')

  const categories = [
    '전체',
    ...new Set(places.map((place) => place.category)),
  ]

  const filteredPlaces = places.filter((place) => {
    const keyword = search.trim().toLowerCase()

    const matchesSearch =
      place.nameKo.toLowerCase().includes(keyword) ||
      place.nameZh.toLowerCase().includes(keyword) ||
      place.district.toLowerCase().includes(keyword) ||
      place.description.toLowerCase().includes(keyword)

    const matchesCategory =
      category === '전체' || place.category === category

    return matchesSearch && matchesCategory
  })

  return (
    <section className="section" id="places">
      <div className="section-heading">
        <h2>천진 장소 찾기</h2>
        <p>한국어와 중국어로 장소를 검색해 보세요.</p>
      </div>

      <div className="places-search">
        <input
          type="search"
          placeholder="예: 천진대학교, 天津大学, 南开区"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="places-filters">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? 'active' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="places-count">
        검색 결과 {filteredPlaces.length}개
      </p>

      <div className="places-grid">
        {filteredPlaces.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <p className="places-empty">
          검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
        </p>
      )}
    </section>
  )
}

export default Places