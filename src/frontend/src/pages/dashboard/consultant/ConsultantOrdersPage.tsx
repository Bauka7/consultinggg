import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../api/orders';
import type { Order } from '../../../api/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

export function ConsultantOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page }],
    queryFn: () => ordersApi.list({ page, limit }),
  });

  const orders: Order[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Заказы</h1>

      {isLoading ? <PageSpinner /> : orders.length === 0 ? (
        <EmptyState title="Заказов нет" icon="📦" />
      ) : (
        <>
          <div className="panel">
            {orders.map((o: Order) => (
              <Link key={o.id} to={`/dashboard/orders/${o.id}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 110px 80px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit', transition: 'background .15s' }}
                className="dash-rrow">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.product || 'Заказ'}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{o.id}</div>
                </div>
                <div style={{ fontSize: 13 }}>{o.factory?.name || '—'}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>${o.total.toLocaleString()}</div>
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
