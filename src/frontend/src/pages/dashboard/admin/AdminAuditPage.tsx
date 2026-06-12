import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin';
import type { AuditLog } from '../../../api/types';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

const ACTION_LABEL: Record<string, string> = {
  approve: 'Одобрение',
  offer: 'Оффер',
  status: 'Смена статуса',
  login: 'Вход',
  block: 'Блокировка',
  invite: 'Приглашение',
  register: 'Регистрация',
  verify: 'Верификация',
  delete: 'Удаление',
};

export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const limit = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { page }],
    queryFn: () => adminApi.listAudit({ page, limit }),
  });

  const allLogs = data?.items || [];
  const logs = action ? allLogs.filter((l) => l.action.toLowerCase().includes(action.toLowerCase())) : allLogs;
  const total = data?.total || 0;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Журнал аудита</h1>

      <div style={{ marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 260 }} placeholder="Фильтр по действию..." value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? <PageSpinner /> : logs.length === 0 ? (
        <EmptyState title="Записей нет" icon="🔍" />
      ) : (
        <>
          <div className="panel">
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px 100px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Время</span><span>Действие / Ресурс</span><span>Пользователь</span><span>IP</span>
            </div>
            {logs.map((log: AuditLog) => (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px 100px', gap: 16, padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>
                  {new Date(log.createdAt).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-accent" style={{ fontSize: 11, flexShrink: 0 }}>{ACTION_LABEL[log.action] || log.action}</span>
                  <span style={{ color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.target || ''}</span>
                </div>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.actor?.name || '—'}</span>
                <span className="mono" style={{ fontSize: 12 }}>{log.ip || '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <Pagination page={page} total={total} limit={limit} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
