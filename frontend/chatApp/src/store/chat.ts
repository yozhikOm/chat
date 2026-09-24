import { create } from 'zustand';
import type { IChannel, IInitialData, IMessage } from '../api/auth';

interface IChatState {
  channels: IChannel[];
  messages: IMessage[];
  activeChannelId: number | null;
  connected: boolean;

  initFromServer: (data: IInitialData) => void;
  setActiveChannel: (id: number) => void;
  addChannel: (channel: IChannel) => void;
  removeChannel: (id: number) => void;
  renameChannel: (channel: IChannel) => void;
  addMessage: (message: IMessage) => void;
  removeMessage: (id: number) => void;
  setConnected: (v: boolean) => void;
}

export const useChatStore = create<IChatState>((set) => ({
  channels: [],
  messages: [],
  activeChannelId: null,
  connected: true,

  initFromServer: (data) =>
    set({
      channels: data.channels,
      messages: data.messages,
      activeChannelId: data.currentChannelId,
    }),

  setActiveChannel: (id) => set({ activeChannelId: id }),

  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),

  removeChannel: (id) =>
    set((state) => {
      const channels = state.channels.filter((c) => c.id !== id);
      const messages = state.messages.filter((m) => m.channelId !== id);
      const activeChannelId =
        state.activeChannelId === id
          ? (channels[0]?.id ?? null)
          : state.activeChannelId;
      return { channels, messages, activeChannelId };
    }),

  renameChannel: (channel) =>
    set((state) => ({
      channels: state.channels.map((c) =>
        c.id === channel.id ? channel : c,
      ),
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // Удаление сообщений
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  setConnected: (v) => set({ connected: v }),
}));

export type { IChatState };