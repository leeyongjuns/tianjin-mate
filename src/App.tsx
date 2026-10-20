import { useState } from 'react'
import './App.css'
import Places from './pages/Places'

const categories = [
  { icon: '🍜', name: '맛집' },
  { icon: '☕', name: '카페' },
  { icon: '🏥', name: '병원' },
  { icon: '🛒', name: '마트' },
  { icon: '🎓', name: '유학생' },
  { icon: '🚇', name: '교통' },
  { icon: '🏠', name: '주거' },
  { icon: '📦', name: '택배' },
]

const guides = [
  {
    title: '중국에서 알리페이 사용하는 방법',
    description: '중국 생활 필수 결제 앱 사용 가이드',
    category: '생활 정보',
  },
  {
    title: '천진대학교 신입생 생활 가이드',
    description: '기숙사부터 수강신청까지 한눈에',
    category: '유학생',
  },
  {
    title: '중국에서 택배 받는 방법',
    description: '차이냐오와 택배 수령 방법 알아보기',
    category: '생활 정보',
  },
]

function App() {
  const [search, setSearch] = useState('')

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">📍 Tianjin Mate</div>
          <nav>
            <a href="#places">장소 찾기</a>
            <a href="#guides">생활 가이드</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-tag">天津 · TIANJIN</span>

            <h1>
              천진 생활,
              <br />
              이제 더 편리하게
            </h1>

            <p>
              천진에 거주하는 한국인을 위한
              <br />
              생활 정보 플랫폼
            </p>

            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="맛집, 병원, 마트 등을 검색하세요"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (search.trim()) {
                    alert(`"${search}" 검색 기능은 곧 추가할 예정입니다.`)
                  }
                }}
              >
                검색
              </button>
            </div>
          </div>
        </section>

        <section className="section" id="categories">
          <div className="section-heading">
            <h2>어떤 정보를 찾으세요?</h2>
            <p>천진 생활에 필요한 정보를 빠르게 찾아보세요.</p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <button
                type="button"
                className="category-card"
                key={category.name}
                onClick={() => setSearch(category.name)}
              >
                <span className="category-icon">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section" id="guides">
          <div className="section-heading">
            <h2>천진 생활 가이드</h2>
            <p>처음 중국 생활을 시작하는 분들을 위한 정보</p>
          </div>

          <div className="guide-grid">
            {guides.map((guide) => (
              <article className="guide-card" key={guide.title}>
                <span className="guide-category">{guide.category}</span>
                <h3>{guide.title}</h3>
                <p>{guide.description}</p>
              </article>
            ))}
          </div>
        </section>
        <Places />
      </main>

      <footer className="footer">
        <p>© 2026 Tianjin Mate. Made for Koreans in Tianjin.</p>
      </footer>
    </div>
  )
}

export default App