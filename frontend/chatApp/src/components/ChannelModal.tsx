import { useRef, useState } from 'react';
import type React from 'react';
import type { FormEvent } from 'react';
import { emitNewChannel, emitRenameChannel } from '../api/socket';
import type { IChannel } from '../api/auth';
import { useChatStore } from '../store/chat';
import Modal from './Modal';

const CHANNEL_NAME_MIN = 2;
const CHANNEL_NAME_MAX = 20;

interface IChannelModalProps {
  mode: 'create' | 'rename';
  channel?: IChannel;
  onClose: () => void;
}

const ChannelModal: React.FunctionComponent<IChannelModalProps> = ({
  mode,
  channel,
  onClose,
}: IChannelModalProps) => {
  const [name, setName] = useState(channel?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length < CHANNEL_NAME_MIN)
      return `Имя канала должно быть не короче ${CHANNEL_NAME_MIN} символов`;
    if (trimmed.length > CHANNEL_NAME_MAX)
      return `Имя канала должно быть не длиннее ${CHANNEL_NAME_MAX} символов`;
    return null;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    const trimmed = name.trim();
    const handleAck = (response: { status: string; data?: IChannel }) => {
      setSubmitting(false);
      if (response.status !== 'ok') {
        setError('Не удалось сохранить канал');
        return;
      }
      if (mode === 'create' && response.data) {
        useChatStore.getState().setActiveChannel(response.data.id);
      }
      onClose();
    };

    if (mode === 'create') {
      emitNewChannel({ name: trimmed }, handleAck);
    } else if (channel) {
      emitRenameChannel({ id: channel.id, name: trimmed }, handleAck);
    }
  };

  return (
    <Modal
      title={mode === 'create' ? 'Создать канал' : 'Переименовать канал'}
      confirmLabel={mode === 'create' ? 'Создать' : 'Переименовать'}
      onSubmit={() => formRef.current?.requestSubmit()}
      onClose={onClose}
      disabled={submitting}
      error={error}
    >
      <form className="channel-form" ref={formRef} onSubmit={handleSubmit}>
        <input
          type="text"
          className="channel-name-input"
          placeholder="Имя канала"
          value={name}
          autoFocus
          maxLength={CHANNEL_NAME_MAX}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
        />
      </form>
    </Modal>
  );
};

export default ChannelModal;