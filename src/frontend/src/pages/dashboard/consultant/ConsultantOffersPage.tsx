import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { offersApi } from '../../../api/offers';
import type { Offer } from '../../../api/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

export function ConsultantOffersPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['offers', { page }],
    queryFn: () => offersApi.list({ page, limit }),
  });

  const offers: Offer[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Мои офферы</h1>

      {isLoading ? <PageSpinner /> : offers.length === 0 ? (
        <EmptyState title="Офферов нет" description="Создайте оффер для запроса клиента" icon="💼" />
      ) : (
        <>
          <div className="panel">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 90px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Запрос</span><span>Цена клиенту</span><span>Срок</span><span>Статус</span><span />
            </div>
            {offers.map((o: Offer) => (
              <Link key={o.id} to={`/dashboard/offers/${o.id}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 90px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit', transition: 'background .15s' }}
                className="dash-rrow">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.product || o.request?.product || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{o.qty || ''}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${o.total.toLocaleString()}</div>
                <div style={{ fontSize: 13 }}>{o.leadTime}</div>
                <StatusBadge status={o.status} />
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
