import { io, Socket } from 'socket.io-client'
import type { Channel, Message } from '../api/auth'
import { useChatStore } from '../store/chat'

const ACK_TIMEOUT = 3000

type AckResponse = { status: string; data?: Channel }

const withAckTimeout = <T extends AckResponse>(
  ack?: (response: T) => void,
) => {
  if (!ack) return undefined
  let done = false
  const timer = setTimeout(() => {
    if (done) return
    done = true
    ack({ status: 'timeout' } as T)
  }, ACK_TIMEOUT)
  const callback = (response: T) => {
    if (done) return
    done = true
    clearTimeout(timer)
    ack(response)
  }
  return callback
}

let socket: Socket | null = null

export const getSocket = () => socket

export const connect = () => {
  if (socket?.connected) return socket

  socket = io('/', { autoConnect: true })

  socket.on('connect', () => useChatStore.getState().setConnected(true))
  socket.on('disconnect', () => useChatStore.getState().setConnected(false))

  socket.on('newMessage', (message: Message) => {
    useChatStore.getState().addMessage(message)
  })

  socket.on('newChannel', (channel: Channel) => {
    useChatStore.getState().addChannel(channel)
  })

  socket.on('removeChannel', ({ id }: { id: number }) => {
    useChatStore.getState().removeChannel(id)
  })

  socket.on('renameChannel', (channel: Channel) => {
    useChatStore.getState().renameChannel(channel)
  })

  return socket
}

export const disconnect = () => {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
  useChatStore.getState().setConnected(false)
}

export type MessagePayload = {
  body: string
  channelId: number
  username: string
}

export const emitMessage = (
  payload: MessagePayload,
  ack?: (response: { status: string }) => void,
) => {
  socket?.emit('newMessage', payload, withAckTimeout(ack))
}

export type ChannelNamePayload = { name: string }

export const emitNewChannel = (
  payload: ChannelNamePayload,
  ack?: (response: { status: string; data: Channel }) => void,
) => {
  socket?.emit('newChannel', payload, withAckTimeout(ack))
}

export const emitRemoveChannel = (
  payload: { id: number },
  ack?: (response: { status: string }) => void,
) => {
  socket?.emit('removeChannel', payload, withAckTimeout(ack))
}

export type RenameChannelPayload = { id: number; name: string }

export const emitRenameChannel = (
  payload: RenameChannelPayload,
  ack?: (response: { status: string }) => void,
) => {
  socket?.emit('renameChannel', payload, withAckTimeout(ack))
}
