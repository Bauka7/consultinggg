import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin';
import { factoriesApi } from '../../../api/factories';
import { categoriesApi } from '../../../api/categories';
import type { Factory, Category } from '../../../api/types';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';

export function AdminFactoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-factories', { page, search }],
    queryFn: () => adminApi.listFactories({ page, limit, search: search || undefined }),
  });

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() });
  const categories: Category[] = cats || [];

  const factories = data?.items || [];
  const total = data?.total || 0;

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.verifyFactory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-factories'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.unverifyFactory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-factories'] }),
  });

  // Create factory
  const [form, setForm] = useState({ name: '', city: '', province: '', categoryId: '', about: '' });
  const [createError, setCreateError] = useState('');
  const createMutation = useMutation({
    mutationFn: () =>
      factoriesApi.create({
        name: form.name,
        city: form.city || undefined,
        province: form.province || undefined,
        about: form.about || undefined,
        categoryIds: form.categoryId ? [form.categoryId] : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-factories'] });
      setShowCreate(false);
      setForm({ name: '', city: '', province: '', categoryId: '', about: '' });
      setCreateError('');
    },
    onError: (e: any) => setCreateError(e.response?.data?.message || 'Ошибка создания завода'),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Заводы</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ Создать завод</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Поиск завода..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? <PageSpinner /> : factories.length === 0 ? (
        <EmptyState title="Заводы не найдены" icon="🏭" action={<button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Создать первый завод</button>} />
      ) : (
        <>
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 120px 130px 80px 220px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Завод</span><span>Провинция</span><span>Статус</span><span>Заказы</span><span style={{ textAlign: 'right' }}>Действия</span>
            </div>
            {factories.map((f: Factory) => (
              <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) 120px 130px 80px 220px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(f.categories || []).slice(0, 2).map((c) => c.category.name).join(', ') || '—'}</div>
                </div>
                <span style={{ fontSize: 13 }}>{f.province || '—'}</span>
                <span>
                  <Badge variant={f.verified ? 'ok' : 'warn'}>{f.verified ? 'Проверен' : 'На проверке'}</Badge>
                </span>
                <span className="section-muted" style={{ fontSize: 13 }}>{f._count?.orders ?? 0}</span>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {f.verified ? (
                    <button className="btn btn-quiet btn-sm" onClick={() => rejectMutation.mutate(f.id)} disabled={rejectMutation.isPending} style={{ color: 'var(--muted)', fontSize: 12, padding: 0 }}>Снять проверку</button>
                  ) : (
                    <button className="btn btn-quiet btn-sm" onClick={() => approveMutation.mutate(f.id)} disabled={approveMutation.isPending} style={{ color: 'var(--ok)', fontSize: 12, padding: 0 }}>Подтвердить</button>
                  )}
                  <Link to={`/factory/${f.id}`} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>Профиль</Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <Pagination page={page} total={total} limit={limit} onChange={setPage} />
          </div>
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Создать завод">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {createError && <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{createError}</div>}
          <div>
            <label className="label">Название завода *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Shenzhen Apex Electronics" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Город</label>
              <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="label">Провинция</label>
              <input className="input" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Категория</label>
            <select className="select" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">— выберите —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea className="input" style={{ minHeight: 80, resize: 'vertical' }} value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Отмена</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? 'Создание...' : 'Создать завод'}
            </button>
          </div>
          <p className="section-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Завод создаётся без владельца. Чтобы назначить администратора завода — отправьте ему invite-ссылку
            (раздел «Приглашения» → роль «Завод» → выберите этот завод).
          </p>
        </div>
      </Modal>
    </div>
  );
}
