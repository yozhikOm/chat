import { useEffect, useState } from 'react';
import type React from 'react';
import { AuthError, fetchData } from '../api/auth';
import type { IInitialData } from '../api/auth';
import { connect, disconnect } from '../api/socket';
import { useChatStore } from '../store/chat';
import MessagePane from '../components/MessagePane';
import MessageInput from '../components/MessageInput';
import ChannelList from '../components/ChannelList';

interface IAppShellProps {
  token: string;
  username: string;
  onLogout: () => void;
}

const AppShell: React.FunctionComponent<IAppShellProps> = ({
  token,
  username,
  onLogout,
}: IAppShellProps) => {
  const [data, setData] = useState<IInitialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connected = useChatStore((state) => state.connected);
  const activeChannel = useChatStore((state) => state.activeChannelId);

  useEffect(() => {
    let cancelled = false;

    fetchData(token)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        useChatStore.getState().initFromServer(result);
        connect();
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AuthError && err.statusCode === 401) {
          onLogout();
        } else {
          setError('Не удалось связаться с сервером. Попробуйте ещё раз.');
        }
      });

    return () => {
      cancelled = true;
      disconnect();
    };
  }, [token, onLogout]);

  return (
    <div className="app-shell">
      <div className="app-header">
        <span className="user">{username}</span>
        <button type="button" onClick={onLogout}>
          Выйти
        </button>
      </div>
      {!connected && (
        <div className="connection-banner">Нет соединения с сервером</div>
      )}
      {error ? (
        <div className="app-error">{error}</div>
      ) : data ? (
        <div className="app-body">
          <ChannelList />
          <div className="message-area">
            {activeChannel != null ? (
              <>
                <MessagePane />
                <MessageInput username={username} />
              </>
            ) : (
              <div className="message-pane">Нет активного канала</div>
            )}
          </div>
        </div>
      ) : (
        <div className="app-error">Загрузка…</div>
      )}
    </div>
  );
};

export default AppShell;