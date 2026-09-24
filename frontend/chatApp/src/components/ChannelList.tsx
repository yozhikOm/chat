import { useState } from 'react'
import { emitRemoveChannel } from '../api/socket'
import type { Channel } from '../api/auth'
import { useChatStore } from '../store/chat'
import Modal from './Modal'
import ChannelModal from './ChannelModal'

type DialogState =
  | { kind: 'create' }
  | { kind: 'rename'; channel: Channel }
  | { kind: 'remove'; channel: Channel }
  | null

function ChannelList() {
  const channels = useChatStore((state) => state.channels)
  const activeChannelId = useChatStore((state) => state.activeChannelId)
  const setActiveChannel = useChatStore((state) => state.setActiveChannel)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const handleRemove = () => {
    if (dialog?.kind !== 'remove') return
    setRemoveError(null)
    setRemoving(true)
    emitRemoveChannel({ id: dialog.channel.id }, (response) => {
      setRemoving(false)
      if (response.status !== 'ok') {
        setRemoveError('Не удалось удалить канал')
        return
      }
      setDialog(null)
    })
  }

  return (
    <>
      <nav className="channel-list">
        <div className="channel-list-header">
          <h3>Каналы</h3>
          <button
            type="button"
            className="channel-add-btn"
            title="Создать канал"
            onClick={() => setDialog({ kind: 'create' })}
          >
            +
          </button>
        </div>
        {channels.map((channel) => (
          <div
            key={channel.id}
            className={`channel-item${channel.id === activeChannelId ? ' active' : ''}`}
            onClick={() => setActiveChannel(channel.id)}
          >
            <span className="channel-name" title={channel.name}>
              # {channel.name}
            </span>
            {channel.removable && (
              <span
                className="channel-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="channel-action-btn"
                  title="Переименовать"
                  onClick={() => setDialog({ kind: 'rename', channel })}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="channel-action-btn danger"
                  title="Удалить"
                  onClick={() => setDialog({ kind: 'remove', channel })}
                >
                  Удалить
                </button>
              </span>
            )}
          </div>
        ))}
      </nav>

      {dialog?.kind === 'create' && (
        <ChannelModal mode="create" onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === 'rename' && (
        <ChannelModal
          mode="rename"
          channel={dialog.channel}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'remove' && (
        <Modal
          title={`Удалить канал #${dialog.channel.name}`}
          confirmLabel="Удалить"
          danger
          onSubmit={handleRemove}
          onClose={() => setDialog(null)}
          disabled={removing}
          error={removeError}
        >
          Вы действительно хотите удалить канал?
        </Modal>
      )}
    </>
  )
}

export default ChannelList