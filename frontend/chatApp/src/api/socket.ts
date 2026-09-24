import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { IChannel, IMessage } from '../api/auth';
import { useChatStore } from '../store/chat';

const ACK_TIMEOUT = 3000;

interface IAckResponse {
  status: string;
  data?: IChannel;
}

const withAckTimeout = <T extends IAckResponse>(
  ack?: (response: T) => void,
): ((response: T) => void) | undefined => {
  if (!ack) return undefined;
  let done = false;
  const timer = setTimeout(() => {
    if (done) return;
    done = true;
    ack({ status: 'timeout' } as T);
  }, ACK_TIMEOUT);
  const callback = (response: T) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    ack(response);
  };
  return callback;
};

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connect = () => {
  if (socket?.connected) return socket;

  socket = io('/', { autoConnect: true });

  socket.on('connect', () => useChatStore.getState().setConnected(true));
  socket.on('disconnect', () => useChatStore.getState().setConnected(false));

  socket.on('newMessage', (message: IMessage) => {
    useChatStore.getState().addMessage(message);
  });

  socket.on('newChannel', (channel: IChannel) => {
    useChatStore.getState().addChannel(channel);
  });

  socket.on('removeChannel', ({ id }: { id: number }) => {
    useChatStore.getState().removeChannel(id);
  });

  socket.on('renameChannel', (channel: IChannel) => {
    useChatStore.getState().renameChannel(channel);
  });

  return socket;
};

export const disconnect = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  useChatStore.getState().setConnected(false);
};

interface IMessagePayload {
  body: string;
  channelId: number;
  username: string;
}

export const emitMessage = (
  payload: IMessagePayload,
  ack?: (response: { status: string }) => void,
) => {
  socket?.emit('newMessage', payload, withAckTimeout(ack));
};

interface IChannelNamePayload {
  name: string;
}

export const emitNewChannel = (
  payload: IChannelNamePayload,
  ack?: (response: { status: string; data: IChannel }) => void,
) => {
  socket?.emit('newChannel', payload, withAckTimeout(ack));
};

interface IRemoveChannelPayload {
  id: number;
}

export const emitRemoveChannel = (
  payload: IRemoveChannelPayload,
  ack?: (response: { status: string }) => void,
) => {
  socket?.emit('removeChannel', payload, withAckTimeout(ack));
};

interface IRenameChannelPayload {
  id: number;
  name: string;
}

export const emitRenameChannel = (
  payload: IRenameChannelPayload,
  ack?: (response: { status: string }) => void,
) => {
  socket?.emit('renameChannel', payload, withAckTimeout(ack));
};

export type { IAckResponse, IChannelNamePayload, IMessagePayload, IRemoveChannelPayload, IRenameChannelPayload };