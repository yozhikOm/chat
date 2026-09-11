import { useCallback, useState } from 'react'
import LoginPage from './pages/LoginPage'
import AppShell from './pages/AppShell'
import './App.css'

const TOKEN_KEY = 'token'
const USERNAME_KEY = 'username'

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(USERNAME_KEY),
  )

  const handleAuth = (authToken: string, authUsername: string) => {
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USERNAME_KEY, authUsername)
    setToken(authToken)
    setUsername(authUsername)
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    setToken(null)
    setUsername(null)
  }, [])

  if (token && username) {
    return <AppShell token={token} username={username} onLogout={handleLogout} />
  }

  return <LoginPage onAuth={handleAuth} />
}

export default App