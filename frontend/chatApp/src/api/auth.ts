interface IAuthResponse {
  token: string;
  username: string;
}

interface IChannel {
  id: number;
  name: string;
  removable: boolean;
}

interface IMessage {
  id: number;
  body: string;
  channelId: number;
  username: string;
}

interface IInitialData {
  channels: IChannel[];
  currentChannelId: number;
  messages: IMessage[];
}

export class AuthError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new AuthError(0, 'network');
  }

  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    throw new AuthError(response.status, response.statusText);
  }
  if (data === null) {
    throw new AuthError(0, 'network');
  }
  return data;
};

export const login = (username: string, password: string): Promise<IAuthResponse> =>
  request<IAuthResponse>('/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

export const signup = (username: string, password: string): Promise<IAuthResponse> =>
  request<IAuthResponse>('/api/v1/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

export const fetchData = (token: string): Promise<IInitialData> =>
  request<IInitialData>('/api/v1/data', {
    headers: { Authorization: `Bearer ${token}` },
  });

export type { IAuthResponse, IChannel, IInitialData, IMessage };