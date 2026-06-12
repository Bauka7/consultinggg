import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '../../../api/offers';
import { StatusBadge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { PageSpinner } from '../../../components/ui/Spinner';
import { useAuth } from '../../../hooks/useAuth';

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isClient } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => offersApi.get(id!),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: () => offersApi.accept(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => offersApi.requestRevision(id!, ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
    },
  });

  const offer = data;

  if (isLoading) return <PageSpinner />;
  if (!offer) return <div>Оффер не найден</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
        <Link to="/dashboard/offers">Офферы</Link>
        <span>›</span>
        <span style={{ color: 'var(--ink)' }}>{offer.request?.product}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>{offer.request?.product}</h1>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center' }}>
            <StatusBadge status={offer.status} />
            <span className="section-muted" style={{ fontSize: 13 }}>Действует до: {offer.validTill ? new Date(offer.validTill).toLocaleDateString('ru') : 'Бессрочно'}</span>
          </div>
        </div>
        {isClient && offer.status === 'pending' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending} style={{ color: 'var(--accent)' }}>
              Запросить правку
            </button>
            <button className="btn btn-primary" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? 'Подтверждение...' : '✓ Принять оффер'}
            </button>
          </div>
        )}
      </div>

      {/* Main offer card */}
      <div className="card" style={{ padding: 28, marginBottom: 20, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Итоговая цена</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36 }}>${offer.total.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Срок поставки</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{offer.leadTime}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 6 }}>КОЛИЧЕСТВО</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{offer.qty}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 6 }}>ДЕЙСТВУЕТ ДО</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{offer.validTill ? new Date(offer.validTill).toLocaleDateString('ru') : '—'}</div>
          </div>
        </div>

        {offer.note && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 8 }}>ПРИМЕЧАНИЯ</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{offer.note}</p>
          </div>
        )}
      </div>

      {/* Consultant */}
      {offer.consultant && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 14 }}>КОНСУЛЬТАНТ</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={offer.consultant.user.name} src={offer.consultant.user.avatarUrl} size={44} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{offer.consultant.user.name}</div>
            </div>
          </div>
          <Link to="/dashboard/messages" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 12, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
            💬 Написать консультанту
          </Link>
        </div>
      )}
    </div>
  );
}
