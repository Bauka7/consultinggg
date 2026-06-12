import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../api/orders';
import type { Order } from '../../../api/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { Panel } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

export function FactoryOverviewPage() {
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['orders', { limit: 8 }],
    queryFn: () => ordersApi.list({ limit: 8 }),
  });

  const orders: Order[] = orderData?.items || [];
  const active = orders.filter((o: Order) => !['closed', 'draft', 'cancelled'].includes(o.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }}>Добрый день 👋</h1>
        <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Панель управления заводом</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { icon: '📦', label: 'Всего заказов', value: orderData?.total || 0, hue: 222 },
          { icon: '⚙️', label: 'Активных', value: active.length, hue: 150 },
          { icon: '✅', label: 'Завершено', value: orders.filter((o: Order) => o.status === 'closed').length, hue: 96 },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `hsl(${s.hue} 70% 94%)`, color: `hsl(${s.hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 20 }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <Panel title="Последние заказы" right={<Link to="/dashboard/orders" className="btn btn-ghost btn-sm">Все →</Link>}>
        {isLoading ? <PageSpinner /> : orders.length === 0 ? (
          <EmptyState title="Заказов пока нет" icon="📦" />
        ) : (
          <div>
            {orders.slice(0, 6).map((o: Order) => (
              <Link key={o.id} to={`/dashboard/orders/${o.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{o.product || 'Заказ'}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)' }}>{o.consultant?.user?.name} · ${o.total.toLocaleString()}</div>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
