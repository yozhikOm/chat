export type AuthResponse = {
  token: string
  username: string
}

export type Channel = {
  id: number
  name: string
  removable: boolean
}

export type InitialData = {
  channels: Channel[]
  currentChannelId: number
  messages: unknown[]
}

export class AuthError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(path, options)
  } catch {
    throw new AuthError(0, 'network')
  }

  const data = (await response.json().catch(() => null)) as T | null
  if (!response.ok) {
    throw new AuthError(response.status, response.statusText)
  }
  if (data === null) {
    throw new AuthError(0, 'network')
  }
  return data
}

export const login = (username: string, password: string): Promise<AuthResponse> =>
  request<AuthResponse>('/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

export const signup = (username: string, password: string): Promise<AuthResponse> =>
  request<AuthResponse>('/api/v1/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

export const fetchData = (token: string): Promise<InitialData> =>
  request<InitialData>('/api/v1/data', {
    headers: { Authorization: `Bearer ${token}` },
  })