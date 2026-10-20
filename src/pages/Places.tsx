
import { useState } from 'react'
import { places } from '../data/places'
import { districts } from '../data/districts'
import PlaceCard from '../components/PlaceCard'
import type { Place } from '../types/place'

interface PlacesProps {
  onSelectPlace: (place: Place) => void
  search: string
  setSearch: (value: string) => void
  category: string
  setCategory: (value: string) => void
}

function Places({
  onSelectPlace,
  search,
  setSearch,
  category,
  setCategory,
}: PlacesProps) {
  // 선택한 지역 상태
  const [selectedDistrict, setSelectedDistrict] = useState('전체')

  // 장소 카테고리 목록
  const categories = [
    '전체',
    ...new Set(places.map((place) => place.category)),
  ]

  // 검색어 + 카테고리 + 지역 필터
  const filteredPlaces = places.filter((place) => {
    const keyword = search.trim().toLowerCase()

    const matchesSearch =
      place.nameKo.toLowerCase().includes(keyword) ||
      place.nameZh.toLowerCase().includes(keyword) ||
      place.district.toLowerCase().includes(keyword)

    const matchesCategory =
      category === '전체' || place.category === category

    const matchesDistrict =
      selectedDistrict === '전체' ||
      place.district === selectedDistrict

    return matchesSearch && matchesCategory && matchesDistrict
  })

  return (
    <section className="section" id="places">
      <div className="section-heading">
        <h2>천진 장소 찾기</h2>
        <p>한국어와 중국어로 장소를 검색해 보세요.</p>
      </div>

      {/* 검색창 */}
      <div className="places-search">
        <input
          type="search"
          placeholder="예: 천진대학교, 天津大学, 南开区"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 카테고리 필터 */}
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

      {/* 지역별 필터 */}
      <div className="district-filter">
        <label htmlFor="district-select">지역 선택</label>

        <select
          id="district-select"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
        >
          {districts.map((district) => (
            <option
              key={district.nameZh}
              value={
                district.nameZh === '全部'
                  ? '전체'
                  : district.nameZh
              }
            >
              {district.nameKo} ({district.nameZh})
            </option>
          ))}
        </select>
      </div>

      {/* 검색 결과 개수 */}
      <p className="places-count">
        검색 결과 {filteredPlaces.length}개
      </p>

      {/* 장소 카드 목록 */}
      <div className="places-grid">
        {filteredPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onSelect={onSelectPlace}
          />
        ))}
      </div>

      {/* 검색 결과 없음 */}
      {filteredPlaces.length === 0 && (
        <p className="places-empty">
          검색 결과가 없습니다. 다른 검색어나 지역을 선택해 보세요.
        </p>
      )}
    </section>
  )
}

export default Places
