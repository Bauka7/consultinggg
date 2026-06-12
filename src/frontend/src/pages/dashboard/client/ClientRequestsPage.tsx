import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import type { SourcingRequest, RequestStatus } from '../../../api/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

const TABS: { key: RequestStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'draft', label: 'Черновики' },
  { key: 'work', label: 'В работе' },
  { key: 'wait', label: 'Ожидают' },
  { key: 'done', label: 'Завершено' },
  { key: 'declined', label: 'Отменённые' },
];

export function ClientRequestsPage() {
  const [status, setStatus] = useState<RequestStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['requests', { status: status === 'all' ? undefined : status, page }],
    queryFn: () => requestsApi.list({ status: status === 'all' ? undefined : status, page, limit }),
  });

  const requests = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Мои заявки</h1>
        <Link to="/dashboard/requests/new" className="btn btn-primary">＋ Новая заявка</Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setStatus(t.key); setPage(1); }}
            style={{
              padding: '10px 16px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
              color: status === t.key ? 'var(--accent)' : 'var(--muted)',
              borderBottom: status === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageSpinner /> : requests.length === 0 ? (
        <EmptyState
          title="Заявок нет"
          description="Создайте первую заявку и консультант возьмёт её в работу"
          icon="📋"
          action={<Link to="/dashboard/requests/new" className="btn btn-primary btn-sm">Создать заявку</Link>}
        />
      ) : (
        <>
          <div className="panel">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px 90px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Товар</span><span>Консультант</span><span>Статус</span><span>Срок</span><span />
            </div>
            {requests.map((r: SourcingRequest) => (
              <Link
                key={r.id}
                to={`/dashboard/requests/${r.id}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 110px 90px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit', transition: 'background .15s' }}
                className="dash-rrow"
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.product}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 2 }}>{r.category?.name || ''} · {r.qty}</div>
                </div>
                <div style={{ fontSize: 13 }}>{r.consultant?.user?.name || '—'}</div>
                <StatusBadge status={r.status} />
                <span className="mono" style={{ fontSize: 13 }}>{r.deadline ? r.deadline.slice(0, 10) : '—'}</span>
                <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Открыть →</span>
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
