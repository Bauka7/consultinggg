import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin';
import type { ConsultantApplication } from '../../../api/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'review', label: 'На рассмотрении' },
  { key: 'approved', label: 'Одобрены' },
  { key: 'rejected', label: 'Отклонены' },
];

export function AdminConsultantAppsPage() {
  const [status, setStatus] = useState('review');
  const [page, setPage] = useState(1);
  const limit = 15;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['consultant-apps', { status, page }],
    queryFn: () => adminApi.listConsultantApps({ status: status === 'all' ? undefined : status, page, limit }),
  });

  const apps = data?.items || [];
  const total = data?.total || 0;

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.moderateApp(id, 'approved'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultant-apps'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => adminApi.moderateApp(id, 'rejected'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultant-apps'] }),
  });

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Заявки консультантов</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--line)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setStatus(t.key); setPage(1); }}
            style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: status === t.key ? 'var(--accent)' : 'var(--muted)', borderBottom: status === t.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageSpinner /> : apps.length === 0 ? (
        <EmptyState title="Заявок нет" icon="📝" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {apps.map((app: ConsultantApplication) => (
              <div key={app.id} className="card" style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <Avatar name={app.name || '?'} size={48} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{app.name}</span>
                      <StatusBadge status={app.status} />
                      <span style={{ fontSize: 12, color: 'var(--faint)' }}>Подана: {new Date(app.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{app.email}</div>
                    {app.motivation && <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>{app.motivation}</p>}
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Опыт: {app.years} лет</div>
                    {(app.categories?.length ?? 0) > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {app.categories!.map((c) => <span key={c.category.id} className="tag" style={{ fontSize: 12 }}>{c.category.name}</span>)}
                      </div>
                    )}
                  </div>
                  {app.status === 'review' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => approveMutation.mutate(app.id)} disabled={approveMutation.isPending}>
                        ✓ Одобрить
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => rejectMutation.mutate({ id: app.id })} disabled={rejectMutation.isPending} style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                        Отклонить
                      </button>
                    </div>
                  )}
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
