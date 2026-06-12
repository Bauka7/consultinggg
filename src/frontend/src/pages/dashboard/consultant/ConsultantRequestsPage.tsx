import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import type { SourcingRequest, RequestStatus } from '../../../api/types';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

const TABS: { key: RequestStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'work', label: 'Нужен оффер' },
  { key: 'wait', label: 'Ждём клиента' },
  { key: 'done', label: 'Завершено' },
  { key: 'declined', label: 'Отменённые' },
];

// Consultant-facing meaning of a request status (action-oriented)
const CONSULTANT_STATUS: Record<string, { label: string; variant: 'accent' | 'gold' | 'ok' | 'default' }> = {
  draft: { label: 'Черновик', variant: 'default' },
  work: { label: 'Нужен оффер', variant: 'gold' },
  wait: { label: 'Ждём клиента', variant: 'accent' },
  done: { label: 'Завершено', variant: 'ok' },
  declined: { label: 'Отменена', variant: 'default' },
};

export function ConsultantRequestsPage() {
  const [status, setStatus] = useState<RequestStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['requests', { status: status === 'all' ? undefined : status, page }],
    queryFn: () => requestsApi.list({ status: status === 'all' ? undefined : status, page, limit }),
  });

  const requests: SourcingRequest[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Запросы клиентов</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--line)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setStatus(t.key); setPage(1); }}
            style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: status === t.key ? 'var(--accent)' : 'var(--muted)', borderBottom: status === t.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageSpinner /> : requests.length === 0 ? (
        <EmptyState title="Запросов нет" icon="📋" />
      ) : (
        <>
          <div className="panel">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 80px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Товар / Клиент</span><span>Кол-во</span><span>Срок</span><span>Статус</span><span />
            </div>
            {requests.map((r: SourcingRequest) => (
              <Link key={r.id} to={`/dashboard/requests/${r.id}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 80px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit', transition: 'background .15s' }}
                className="dash-rrow">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.product}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{r.client?.name || '—'} · {r.category?.name}</div>
                </div>
                <div style={{ fontSize: 13 }}>{r.qty}</div>
                <div className="mono" style={{ fontSize: 13 }}>{r.deadline ? r.deadline.slice(0, 10) : '—'}</div>
                <Badge variant={(CONSULTANT_STATUS[r.status] || CONSULTANT_STATUS.draft).variant}>
                  {(CONSULTANT_STATUS[r.status] || CONSULTANT_STATUS.draft).label}
                </Badge>
                <span style={{ color: 'var(--accent)', fontSize: 13 }}>→</span>
              </Link>
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
