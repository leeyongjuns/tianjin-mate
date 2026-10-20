
import { useState } from 'react'

type RegisterProps = {
  onBack: () => void
  onSuccess: () => void
}

function Register({ onBack, onSuccess }: RegisterProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 12) {
      setError('비밀번호는 12자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8000/api/users/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password,
            nickname,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : '회원가입 정보를 확인해 주세요.'
        )
      }

      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '회원가입 중 오류가 발생했습니다.'
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
          ← 로그인으로
        </button>

        <h1>Tianjin Mate 회원가입</h1>
        <p>천진 생활 정보를 함께 나누는 회원이 되어보세요.</p>

        <form onSubmit={handleRegister}>
          <label htmlFor="register-username">아이디</label>
          <input
            id="register-username"
            type="text"
            placeholder="영문, 숫자, 밑줄 3~100자"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={100}
            pattern="[A-Za-z0-9_]+"
            autoComplete="username"
            required
          />

          <label htmlFor="register-email">이메일</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="register-nickname">닉네임</label>
          <input
            id="register-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />

          <label htmlFor="register-password">비밀번호</label>
          <input
            id="register-password"
            type="password"
            placeholder="12자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
          />

          <label htmlFor="register-confirm">
            비밀번호 확인
          </label>
          <input
            id="register-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Register
