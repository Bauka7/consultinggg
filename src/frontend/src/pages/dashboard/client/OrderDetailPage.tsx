import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, ORDER_FLOW, ORDER_STATUS_LABELS, OrderStatus } from '../../../api/orders';
import { reviewsApi } from '../../../api/reviews';
import { StatusBadge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { PageSpinner } from '../../../components/ui/Spinner';
import { useAuth } from '../../../hooks/useAuth';
import clsx from 'clsx';

function OrderStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIdx = ORDER_FLOW.indexOf(currentStatus);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 600, gap: 0 }}>
        {ORDER_FLOW.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, minWidth: 80 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center',
                  background: isDone ? 'var(--ok-soft)' : isCurrent ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: `2px solid ${isDone ? 'var(--ok)' : isCurrent ? 'var(--accent)' : 'var(--line)'}`,
                  color: isDone ? 'var(--ok)' : isCurrent ? 'var(--accent)' : 'var(--faint)',
                  fontSize: 14, fontWeight: 700, transition: 'all .3s',
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: isCurrent ? 'var(--accent)' : isDone ? 'var(--ok)' : 'var(--faint)', textAlign: 'center', lineHeight: 1.3 }}>
                  {ORDER_STATUS_LABELS[step]}
                </div>
              </div>
              {i < ORDER_FLOW.length - 1 && (
                <div style={{ flex: 1, height: 2, marginTop: 17, background: isDone ? 'var(--ok)' : 'var(--line)', minWidth: 16, transition: 'background .3s' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isConsultant, isFactory, user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReview, setShowReview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.update(id!, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ consultantId }: { consultantId: string }) =>
      reviewsApi.create({ orderId: id!, consultantId, rating: reviewRating, text: reviewComment }),
    onSuccess: () => {
      setShowReview(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const order = data;

  if (isLoading) return <PageSpinner />;
  if (!order) return <div>Заказ не найден</div>;

  const nextStatus = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
        <Link to="/dashboard/orders">Заказы</Link>
        <span>›</span>
        <span style={{ color: 'var(--ink)' }}>#{id?.slice(-6)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>{order.product || 'Заказ'}</h1>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
            <StatusBadge status={order.status} />
            {order.trackingNumber && (
              <span className="pill-mono">Трек: {order.trackingNumber}</span>
            )}
          </div>
        </div>
        {(isConsultant || isFactory) && nextStatus && (
          <button
            className="btn btn-primary"
            onClick={() => updateStatusMutation.mutate(nextStatus as OrderStatus)}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? '...' : `→ ${ORDER_STATUS_LABELS[nextStatus as OrderStatus]}`}
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Статус заказа</h2>
        <OrderStepper currentStatus={order.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Order details */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Детали заказа</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Сумма', `$${order.total.toLocaleString()}`],
                ['Завод', order.factory?.name || '—'],
                ['Консультант', order.consultant?.user?.name || '—'],
                ['Трекинг', order.trackingNumber || 'Не указан'],
                ['Перевозчик', order.cargoCompany || '—'],
                ['Ожидаемая доставка', order.eta ? new Date(order.eta).toLocaleDateString('ru') : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 14, color: 'var(--faint)', width: 160, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>История статусов</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {order.statusHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      {i < order.statusHistory!.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--line)', minHeight: 20 }} />}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{ORDER_STATUS_LABELS[h.status]}</div>
                      {h.note && <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>{h.note}</p>}
                      <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>
                        {new Date(h.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {order.consultant && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 12 }}>КОНСУЛЬТАНТ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={order.consultant.user.name} src={order.consultant.user.avatarUrl} size={40} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>{order.consultant.user.name}</div>
              </div>
            </div>
          )}

          {order.factory && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 12 }}>ЗАВОД</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🏭</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{order.factory.name}</div>
              </div>
            </div>
          )}

          {(order.status === 'delivered' || order.status === 'closed') && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Оставить отзыв</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: s <= reviewRating ? 'var(--warn)' : 'var(--line-2)' }}>★</button>
                ))}
              </div>
              <textarea className="input" placeholder="Ваш отзыв..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} style={{ marginBottom: 10, minHeight: 72, resize: 'vertical' }} />
              {order.consultant && (
                <button className="btn btn-primary btn-sm btn-block" onClick={() => reviewMutation.mutate({ consultantId: order.consultantId })} disabled={reviewMutation.isPending}>
                  Оценить консультанта
                </button>
              )}
            </div>
          )}

          <Link to="/dashboard/messages" className="btn btn-ghost btn-block" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
            💬 Сообщения
          </Link>
        </div>
      </div>
    </div>
  );
}
