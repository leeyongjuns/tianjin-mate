
import { useEffect, useState } from 'react'
import './App.css'
import Places from './pages/Places'
import type { Place } from './types/place'
import PlaceDetail from './pages/PlaceDetail'
import Login from './pages/Login'
import Register from './pages/Register'

type User = {
  id: number
  username: string
  nickname: string | null
  role: 'user' | 'admin'
}

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
  const [category, setCategory] = useState('전체')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  // 로그인 및 회원가입 화면
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  // 현재 로그인한 사용자
  const [user, setUser] = useState<User | null>(null)

  // 새로고침 후 로그인 상태 복원
  useEffect(() => {
    const controller = new AbortController()

    async function checkLogin() {
      try {
        const response = await fetch(
          'http://localhost:8000/api/users/me',
          {
            credentials: 'include',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          if (!controller.signal.aborted) {
            setUser(null)
          }
          return
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setUser(data.user)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('로그인 상태 확인 실패:', error)
        }
      }
    }

    checkLogin()

    return () => controller.abort()
  }, [])

  // 장소 찾기로 이동
  function goToPlaces() {
    setShowLogin(false)
    setShowRegister(false)
    setSelectedPlace(null)

    requestAnimationFrame(() => {
      document.getElementById('places')?.scrollIntoView({
        behavior: 'smooth',
      })
    })
  }

  // 생활 가이드로 이동
  function goToGuides() {
    setShowLogin(false)
    setShowRegister(false)
    setSelectedPlace(null)

    requestAnimationFrame(() => {
      document.getElementById('guides')?.scrollIntoView({
        behavior: 'smooth',
      })
    })
  }

  // 로그인 화면 열기
  function openLogin() {
    setSelectedPlace(null)
    setShowRegister(false)
    setShowLogin(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // 로그아웃
  async function handleLogout() {
    try {
      const response = await fetch(
        'http://localhost:8000/api/users/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('로그아웃 실패')
      }

      setUser(null)
      setShowLogin(false)
      setShowRegister(false)
      setSelectedPlace(null)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch {
      alert('로그아웃에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">📍 Tianjin Mate</div>

          <nav>
            <a
              href="#places"
              onClick={(e) => {
                e.preventDefault()
                goToPlaces()
              }}
            >
              장소 찾기
            </a>

            <a
              href="#guides"
              onClick={(e) => {
                e.preventDefault()
                goToGuides()
              }}
            >
              생활 가이드
            </a>

            {user ? (
              <>
                <span>
                  {user.nickname || user.username}님
                  {user.role === 'admin' ? ' (관리자)' : ''}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openLogin}
              >
                로그인
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {showRegister ? (
          <Register
            onBack={() => {
              setShowRegister(false)
              setShowLogin(true)
            }}
            onSuccess={() => {
              setShowRegister(false)
              setShowLogin(true)

              alert('회원가입이 완료되었습니다. 로그인해 주세요.')
            }}
          />
        ) : showLogin ? (
          <Login
            onLogin={(loggedInUser) => {
              setUser(loggedInUser)
              setShowLogin(false)
              setShowRegister(false)

              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }}
            onBack={() => {
              setShowLogin(false)
              setShowRegister(false)
            }}
            onRegister={() => {
              setShowLogin(false)
              setShowRegister(true)

              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }}
          />
        ) : selectedPlace ? (
          <PlaceDetail
            place={selectedPlace}
            onBack={goToPlaces}
          />
        ) : (
          <>
            {/* 메인 배너 */}
            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-tag">
                  天津 · TIANJIN
                </span>

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
                      setCategory('전체')

                      document
                        .getElementById('places')
                        ?.scrollIntoView({
                          behavior: 'smooth',
                        })
                    }}
                  >
                    검색
                  </button>
                </div>
              </div>
            </section>

            {/* 카테고리 */}
            <section
              className="section"
              id="categories"
            >
              <div className="section-heading">
                <h2>어떤 정보를 찾으세요?</h2>
                <p>
                  천진 생활에 필요한 정보를 빠르게 찾아보세요.
                </p>
              </div>

              <div className="category-grid">
                {categories.map((item) => (
                  <button
                    type="button"
                    className="category-card"
                    key={item.name}
                    onClick={() => {
                      setSearch('')
                      setCategory(item.name)

                      document
                        .getElementById('places')
                        ?.scrollIntoView({
                          behavior: 'smooth',
                        })
                    }}
                  >
                    <span className="category-icon">
                      {item.icon}
                    </span>

                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 생활 가이드 */}
            <section
              className="section"
              id="guides"
            >
              <div className="section-heading">
                <h2>천진 생활 가이드</h2>
                <p>
                  처음 중국 생활을 시작하는 분들을 위한 정보
                </p>
              </div>

              <div className="guide-grid">
                {guides.map((guide) => (
                  <article
                    className="guide-card"
                    key={guide.title}
                  >
                    <span className="guide-category">
                      {guide.category}
                    </span>

                    <h3>{guide.title}</h3>
                    <p>{guide.description}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* 장소 검색 */}
            <Places
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              onSelectPlace={(place) => {
                setSelectedPlace(place)

                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                })
              }}
            />
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          © 2026 Tianjin Mate. Made for Koreans in Tianjin.
        </p>
      </footer>
    </div>
  )
}

export default App
