import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthError, login, signup } from '../api/auth'

type Tab = 'login' | 'signup'

type LoginPageProps = {
  onAuth: (token: string, username: string) => void
}

const ERROR_MESSAGES: Record<number, string> = {
  401: 'Неверное имя пользователя или пароль',
  409: 'Такой пользователь уже существует',
}

function LoginPage({ onAuth }: LoginPageProps) {
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (username.trim() === '' || password === '') {
      setError('Введите имя пользователя и пароль')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = tab === 'login' ? login : signup
      const response = await request(username.trim(), password)
      onAuth(response.token, response.username)
    } catch (err) {
      if (err instanceof AuthError) {
        setError(ERROR_MESSAGES[err.statusCode] ?? 'Не удалось связаться с сервером')
      } else {
        setError('Не удалось связаться с сервером')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Чат</h1>
        <div className="login-tabs">
          <button
            type="button"
            className={tab === 'login' ? 'active' : ''}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={tab === 'signup' ? 'active' : ''}
            onClick={() => {
              setTab('signup')
              setError(null)
            }}
          >
            Регистрация
          </button>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <fieldset disabled={loading}>
            <label>
              Имя пользователя
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                name="password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </fieldset>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage