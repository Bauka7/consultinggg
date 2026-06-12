import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin';
import { reviewsApi } from '../../../api/reviews';
import type { Review } from '../../../api/types';
import { Avatar } from '../../../components/ui/Avatar';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

export function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', { page }],
    queryFn: () => adminApi.listPendingReviews({ page, limit }),
  });

  const reviews = data?.items || [];
  const total = data?.total || 0;

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 6 }}>Модерация отзывов</h1>
      <p className="section-muted" style={{ fontSize: 14, marginBottom: 24 }}>Отзывы публикуются и влияют на рейтинг только после одобрения.</p>

      {isLoading ? <PageSpinner /> : reviews.length === 0 ? (
        <EmptyState title="Нет отзывов на модерации" icon="⭐" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map((r: Review) => (
              <div key={r.id} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <Avatar name={r.author?.name || '?'} src={r.author?.avatarUrl} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{r.author?.name || 'Аноним'}</span>
                      <span style={{ color: 'var(--warn)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="badge">🤝 {r.consultant?.user?.name || 'Консультант'}</span>
                      <span style={{ fontSize: 12, color: 'var(--faint)' }}>{new Date(r.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                    {r.text && <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{r.text}</p>}
                    {r.autoFlag && (
                      <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--warn)', background: 'var(--warn-soft)', padding: '6px 10px', borderRadius: 'var(--r-sm)', display: 'inline-block' }}>
                        ⚠ Авто-флаг: {r.autoFlag}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending} style={{ whiteSpace: 'nowrap' }}>
                      ✓ Одобрить
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending} style={{ color: 'var(--accent)', borderColor: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      Удалить
                    </button>
                  </div>
                </div>
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
