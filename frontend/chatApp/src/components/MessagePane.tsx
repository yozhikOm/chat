import { useEffect, useMemo, useRef } from 'react';
import type React from 'react';
import { useChatStore } from '../store/chat';

const NEAR_BOTTOM_THRESHOLD = 40;

const MessagePane: React.FunctionComponent = () => {
  const messages = useChatStore((state) => state.messages);
  const activeChannelId = useChatStore((state) => state.activeChannelId);
  const containerRef = useRef<HTMLDivElement>(null);

  const channelMessages = useMemo(
    () =>
      messages
        .filter((m) => m.channelId === activeChannelId)
        .sort((a, b) => a.id - b.id),
    [messages, activeChannelId],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      NEAR_BOTTOM_THRESHOLD;

    if (nearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [channelMessages.length]);

  return (
    <div className="message-pane" ref={containerRef}>
      {channelMessages.map((message) => (
        <div key={message.id} className="message">
          <span className="message-username">{message.username}</span>
          <span className="message-body">{message.body}</span>
        </div>
      ))}
    </div>
  );
};

export default MessagePane;