import { useState } from 'react';
import type React from 'react';
import type { FormEvent } from 'react';
import { emitMessage } from '../api/socket';
import { useChatStore } from '../store/chat';

const MESSAGE_MAX = 500;

interface IMessageInputProps {
  username: string;
}

const MessageInput: React.FunctionComponent<IMessageInputProps> = ({
  username,
}: IMessageInputProps) => {
  const activeChannelId = useChatStore((state) => state.activeChannelId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const validate = (value: string): string | null => {
    if (value.trim() === '') return 'Сообщение не должно быть пустым';
    if (value.length > MESSAGE_MAX)
      return `Сообщение слишком длинное (максимум ${MESSAGE_MAX} символов)`;
    return null;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (activeChannelId == null) return;

    const validationError = validate(text);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSending(true);

    emitMessage(
      { body: text.trim(), channelId: activeChannelId, username },
      (response) => {
        setSending(false);
        if (response.status !== 'ok') {
          setError('Не удалось отправить сообщение');
          return;
        }
        setText('');
      },
    );
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      <div className="message-input-row">
        <input
          type="text"
          className="message-input"
          placeholder="Введите сообщение…"
          value={text}
          maxLength={MESSAGE_MAX}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
        />
        <button type="submit" className="send-btn" disabled={sending}>
          Отправить
        </button>
      </div>
    </form>
  );
};

export default MessageInput;