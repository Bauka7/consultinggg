import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import { ordersApi } from '../../../api/orders';
import { offersApi } from '../../../api/offers';
import type { SourcingRequest, Offer, Order } from '../../../api/types';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../components/ui/Badge';
import { Panel } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';

export function ConsultantOverviewPage() {
  const { user } = useAuth();

  const { data: reqData } = useQuery({ queryKey: ['requests', { limit: 5 }], queryFn: () => requestsApi.list({ limit: 5 }) });
  const { data: offerData } = useQuery({ queryKey: ['offers', { limit: 3 }], queryFn: () => offersApi.list({ limit: 3 }) });
  const { data: orderData } = useQuery({ queryKey: ['orders', { limit: 3 }], queryFn: () => ordersApi.list({ limit: 3 }) });

  const requests: SourcingRequest[] = reqData?.items || [];
  const offers: Offer[] = offerData?.items || [];
  const orders: Order[] = orderData?.items || [];

  const pending = requests.filter((r: SourcingRequest) => ['work', 'wait'].includes(r.status));
  const active = orders.filter((o: Order) => !['closed', 'cancelled'].includes(o.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }}>Добрый день, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Вот текущее состояние ваших запросов и заказов</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { icon: '📥', label: 'Входящих запросов', value: pending.length, hue: 222 },
          { icon: '💼', label: 'Офферов отправлено', value: offers.length, hue: 38 },
          { icon: '📦', label: 'Активных заказов', value: active.length, hue: 150 },
          { icon: '⭐', label: 'Доставлено', value: orders.filter((o: Order) => o.status === 'delivered').length, hue: 256 },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `hsl(${s.hue} 70% 94%)`, color: `hsl(${s.hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 20 }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Panel title="Новые запросы" right={<Link to="/dashboard/requests" className="btn btn-ghost btn-sm">Все →</Link>}>
          {pending.length === 0 ? (
            <EmptyState title="Нет новых запросов" icon="📥" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pending.slice(0, 4).map((r: SourcingRequest) => (
                <Link key={r.id} to={`/dashboard/requests/${r.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.product}</div>
                    <div style={{ fontSize: 12, color: 'var(--faint)' }}>{r.client?.name} · {r.qty}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Активные заказы" right={<Link to="/dashboard/orders" className="btn btn-ghost btn-sm">Все →</Link>}>
          {active.length === 0 ? (
            <EmptyState title="Нет активных заказов" icon="📦" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {active.slice(0, 4).map((o: Order) => (
                <Link key={o.id} to={`/dashboard/orders/${o.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.product || 'Заказ'}</div>
                    <div style={{ fontSize: 12, color: 'var(--faint)' }}>{o.factory?.name}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
