
import { useState } from 'react'

type User = {
  id: number
  username: string
  nickname: string | null
  role: 'user' | 'admin'
}

type LoginProps = {
  onLogin: (user: User) => void
  onBack: () => void
  onRegister: () => void
}

function Login({ onLogin, onBack, onRegister }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8000/api/users/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username,
            password,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('아이디 또는 비밀번호를 확인해 주세요.')
      }

      const data = await response.json()
      onLogin(data.user)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '로그인 중 오류가 발생했습니다.'
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

        <h1>Tianjin Mate 로그인</h1>
        <p>천진 생활 정보를 함께 나눠보세요.</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="login-username">아이디</label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="login-password">비밀번호</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입 페이지 이동 */}
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          아직 계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={onRegister}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            회원가입
          </button>
        </p>
      </div>
    </section>
  )
}

export default Login
