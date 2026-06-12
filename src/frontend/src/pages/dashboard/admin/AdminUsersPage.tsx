import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin';
import type { User } from '../../../api/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

const ROLES = [
  { value: '', label: 'Все роли' },
  { value: 'client', label: 'Клиенты' },
  { value: 'consultant', label: 'Консультанты' },
  { value: 'factory_admin', label: 'Заводы' },
  { value: 'platform_admin', label: 'Администраторы' },
];

const ROLE_LABEL: Record<string, string> = {
  client: 'Клиент',
  consultant: 'Консультант',
  factory_admin: 'Завод',
  platform_admin: 'Администратор',
};

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, role, search }],
    queryFn: () => adminApi.listUsers({ page, limit, role: role || undefined, search: search || undefined }),
  });

  const users = data?.items || [];
  const total = data?.total || 0;

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.blockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.unblockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Пользователи</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input" style={{ maxWidth: 260 }} placeholder="Поиск по email / имени..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="select" style={{ width: 'auto' }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {isLoading ? <PageSpinner /> : users.length === 0 ? (
        <EmptyState title="Пользователи не найдены" icon="👥" />
      ) : (
        <>
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 130px 120px 120px 150px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Пользователь</span><span>Роль</span><span>Статус</span><span>Регистрация</span><span style={{ textAlign: 'right' }}>Действия</span>
            </div>
            {users.map((u: User) => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 130px 120px 120px 150px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <span><span className="badge">{ROLE_LABEL[u.role] || u.role}</span></span>
                <StatusBadge status={u.status} />
                <span className="mono" style={{ fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('ru')}</span>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  {u.role === 'platform_admin' ? (
                    <span className="section-muted" style={{ fontSize: 12 }}>—</span>
                  ) : u.status === 'blocked' ? (
                    <button className="btn btn-quiet btn-sm" onClick={() => activateMutation.mutate(u.id)} disabled={activateMutation.isPending} style={{ color: 'var(--ok)', fontSize: 12, padding: 0, whiteSpace: 'nowrap' }}>
                      Разблокировать
                    </button>
                  ) : (
                    <button className="btn btn-quiet btn-sm" onClick={() => suspendMutation.mutate(u.id)} disabled={suspendMutation.isPending} style={{ color: 'var(--accent)', fontSize: 12, padding: 0, whiteSpace: 'nowrap' }}>
                      Заблокировать
                    </button>
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
