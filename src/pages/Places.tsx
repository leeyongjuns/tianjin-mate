
import { useEffect, useState } from 'react'
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
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // FastAPI 서버에서 장소 목록 가져오기
  useEffect(() => {
    const controller = new AbortController()

    async function fetchPlaces() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          'http://localhost:8000/api/places',
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('장소 데이터를 불러오지 못했습니다.')
        }

        const data: Place[] = await response.json()
        setPlaces(data)
      } catch (err) {
        if (controller.signal.aborted) return

        setError(
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchPlaces()

    return () => controller.abort()
  }, [])

  const categories = [
    '전체',
    ...new Set(places.map((place) => place.category)),
  ]

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

      {loading ? (
        <p className="places-count">장소 정보를 불러오는 중...</p>
      ) : error ? (
        <p className="places-empty" role="alert">
          {error}
          <br />
          FastAPI 서버가 실행 중인지 확인해 주세요.
        </p>
      ) : (
        <>
          <p className="places-count">
            검색 결과 {filteredPlaces.length}개
          </p>

          <div className="places-grid">
            {filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onSelect={onSelectPlace}
              />
            ))}
          </div>

          {filteredPlaces.length === 0 && (
            <p className="places-empty">
              검색 결과가 없습니다.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default Places
