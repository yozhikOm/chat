import { useEffect, useState } from 'react'
import { AuthError, fetchData } from '../api/auth'
import type { InitialData } from '../api/auth'

type AppShellProps = {
  token: string
  username: string
  onLogout: () => void
}

function AppShell({ token, username, onLogout }: AppShellProps) {
  const [data, setData] = useState<InitialData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchData(token)
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof AuthError && err.statusCode === 401) {
          onLogout()
        } else {
          setError('Не удалось связаться с сервером. Попробуйте ещё раз.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, onLogout])

  return (
    <div className="app-shell">
      <div className="app-header">
        <span className="user">{username}</span>
        <button type="button" onClick={onLogout}>
          Выйти
        </button>
      </div>
      {error ? (
        <div className="app-error">{error}</div>
      ) : data ? (
        <div className="app-body">
          <nav className="channel-list">
            <h3>Каналы</h3>
            {data.channels.map((channel) => (
              <div
                key={channel.id}
                className={`channel-item${channel.id === data.currentChannelId ? ' active' : ''}`}
              >
                # {channel.name}
              </div>
            ))}
          </nav>
          <div className="message-pane">Сообщения появятся здесь</div>
        </div>
      ) : (
        <div className="app-error">Загрузка…</div>
      )}
    </div>
  )
}

export default AppShell