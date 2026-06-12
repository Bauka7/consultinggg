import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi, Thread, Message } from '../../../api/messaging';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';
import { Avatar } from '../../../components/ui/Avatar';
import { PageSpinner } from '../../../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

function formatTime(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
  } catch {
    return date;
  }
}

export function MessagesPage() {
  const { user, isClient } = useAuth();
  const queryClient = useQueryClient();
  const { on, emit } = useSocket();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: () => messagingApi.listThreads(),
    refetchInterval: 10000,
  });

  // Clients don't see factory threads (also enforced server-side)
  const threads: Thread[] = (threadsData || []).filter((t: Thread) => {
    if (isClient && t.kind === 'factory') return false;
    return true;
  });

  const { data: msgData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', activeThread],
    queryFn: () => messagingApi.getMessages(activeThread!),
    enabled: !!activeThread,
    refetchInterval: 5000,
  });

  // Backend returns newest-first; show oldest-first in the chat
  const messages: Message[] = [...(msgData?.items || [])].reverse();

  const sendMutation = useMutation({
    mutationFn: () => messagingApi.sendMessage({ threadId: activeThread!, body: draft }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeThread] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  // Real-time socket — gateway emits 'new_message' to the thread room
  useEffect(() => {
    const unsub = on('new_message', (msg: any) => {
      if (msg?.threadId === activeThread) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeThread] });
      }
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    });
    return unsub as () => void;
  }, [on, activeThread, queryClient]);

  // Join the active thread room so the gateway broadcasts reach us
  useEffect(() => {
    if (!activeThread) return;
    emit('join_thread', { threadId: activeThread });
    return () => emit('leave_thread', { threadId: activeThread });
  }, [activeThread, emit]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Auto-select first thread
  useEffect(() => {
    if (threads.length > 0 && !activeThread) {
      setActiveThread(threads[0].id);
    }
  }, [threads.length]);

  const activeThreadObj = threads.find((t: Thread) => t.id === activeThread);

  const KIND_LABEL: Record<string, string> = { client: 'Клиент', factory: 'Завод · скрытая линия', support: 'Поддержка' };

  // Backend provides a display-ready title/subtitle per viewer role.
  function getThreadTitle(t: Thread) {
    return t.title || KIND_LABEL[t.kind] || 'Чат';
  }
  function getThreadSubtitle(t: Thread) {
    return t.subtitle || KIND_LABEL[t.kind] || '';
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !activeThread) return;
    sendMutation.mutate();
  }

  return (
    <div className="msg-layout" style={{ margin: -28, height: 'calc(100vh - 60px)' }}>
      {/* Thread list */}
      <div className="msg-threads">
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
          Сообщения
        </div>
        {threadsLoading ? <PageSpinner /> : threads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>Нет чатов</div>
        ) : threads.map((t: Thread) => {
          const last = t.messages?.[0];
          const unread = t._count?.messages || 0;
          return (
          <div
            key={t.id}
            className={`msg-thread-item ${activeThread === t.id ? 'active' : ''}`}
            onClick={() => setActiveThread(t.id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Avatar name={getThreadTitle(t)} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.kind === 'factory' && <span title="Скрытая линия с заводом">🔒</span>}
                    {t.kind === 'support' && <span>🛟</span>}
                    {getThreadTitle(t)}
                  </span>
                  {unread > 0 && (
                    <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700, padding: '2px 7px', flexShrink: 0 }}>
                      {unread}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: t.kind === 'factory' ? 'var(--warn)' : 'var(--faint)', marginTop: 1 }}>{getThreadSubtitle(t)}</div>
                {last && (
                  <div style={{ fontSize: 13, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {last.body.slice(0, 50)}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
                  {formatTime(t.createdAt)}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Chat panel */}
      {activeThread && activeThreadObj ? (
        <div className="msg-chat">
          <div className="msg-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={getThreadTitle(activeThreadObj)} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getThreadTitle(activeThreadObj)}
                  {activeThreadObj.kind === 'factory' && (
                    <span className="badge badge-gold" style={{ fontSize: 10.5 }}>🔒 скрыто от клиента</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--faint)' }}>
                  {activeThreadObj.kind === 'factory' ? '🏭 ' : activeThreadObj.kind === 'support' ? '🛟 ' : '💬 '}
                  {getThreadSubtitle(activeThreadObj)}
                </div>
              </div>
            </div>
          </div>

          <div className="msg-messages">
            {msgsLoading ? <PageSpinner /> : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 14, marginTop: 40 }}>Начните переписку</div>
            ) : messages.map((msg: Message) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                  {!isOwn && msg.sender && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={msg.sender.name} src={msg.sender.avatarUrl} size={20} />
                      <span style={{ fontSize: 12, color: 'var(--faint)' }}>{msg.sender.name}</span>
                    </div>
                  )}
                  <div className={`bubble ${isOwn ? 'bubble-out' : 'bubble-in'}`}>
                    {msg.body}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="msg-input-bar" onSubmit={handleSend}>
            <textarea
              className="input"
              style={{ resize: 'none', minHeight: 44, maxHeight: 120, flex: 1 }}
              placeholder="Введите сообщение..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              rows={1}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!draft.trim() || sendMutation.isPending}
              style={{ flexShrink: 0 }}
            >
              {sendMutation.isPending ? '...' : 'Отправить'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center', color: 'var(--faint)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div>Выберите чат</div>
          </div>
        </div>
      )}
    </div>
  );
}
