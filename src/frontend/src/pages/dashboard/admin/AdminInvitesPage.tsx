import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitesApi } from '../../../api/invites';
import { factoriesApi } from '../../../api/factories';
import type { Invite, Factory } from '../../../api/types';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';

export function AdminInvitesPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newInvite, setNewInvite] = useState<{ email: string; role: 'consultant' | 'factory'; factoryId: string }>({
    email: '',
    role: 'consultant',
    factoryId: '',
  });
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: () => invitesApi.list(),
  });

  // Factories to attach when inviting a factory owner
  const { data: facData } = useQuery({
    queryKey: ['factories', 'for-invite'],
    queryFn: () => factoriesApi.list({ limit: 100 }),
    enabled: showCreate && newInvite.role === 'factory',
  });
  const factories: Factory[] = facData?.items || [];

  const invites = data || [];
  const total = invites.length;

  const createMutation = useMutation({
    mutationFn: () =>
      invitesApi.create({
        email: newInvite.email,
        role: newInvite.role,
        factoryId: newInvite.role === 'factory' && newInvite.factoryId ? newInvite.factoryId : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      setShowCreate(false);
      setNewInvite({ email: '', role: 'consultant', factoryId: '' });
      setError('');
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Ошибка создания приглашения'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => invitesApi.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites'] }),
  });

  function copyLink(inv: Invite) {
    const url = `${window.location.origin}/invite/${inv.token}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(''), 1500);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Приглашения</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ Создать приглашение</button>
      </div>

      {isLoading ? <PageSpinner /> : invites.length === 0 ? (
        <EmptyState title="Приглашений нет" icon="✉️" action={<button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Создать первое</button>} />
      ) : (
        <>
          <div className="panel">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 100px 160px', gap: 16, padding: '10px 20px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Email</span><span>Роль</span><span>Создано</span><span>Статус</span><span>Действия</span>
            </div>
            {invites.map((inv: Invite) => (
              <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 100px 160px', gap: 16, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.email || 'Без email'}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{inv.token.slice(0, 16)}…{inv.factory ? ` · ${inv.factory.name}` : ''}</div>
                </div>
                <span className="badge">{inv.role === 'factory' ? 'Завод' : 'Консультант'}</span>
                <span className="mono" style={{ fontSize: 12 }}>{new Date(inv.createdAt).toLocaleDateString('ru')}</span>
                <span className={`badge ${inv.status === 'used' ? 'badge-ok' : ''}`}>{inv.status === 'used' ? 'Использовано' : inv.status === 'expired' ? 'Истекло' : 'Активно'}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {inv.status === 'pending' && (
                    <>
                      <button className="btn btn-quiet btn-sm" onClick={() => copyLink(inv)} style={{ color: 'var(--ok)', fontSize: 12 }}>
                        {copiedId === inv.id ? '✓ Скопировано' : 'Копировать'}
                      </button>
                      <button className="btn btn-quiet btn-sm" onClick={() => revokeMutation.mutate(inv.id)} style={{ color: 'var(--accent)', fontSize: 12 }}>
                        Отозвать
                      </button>
                    </>
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

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Создать приглашение"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Отмена</button>
            <button
              className="btn btn-primary"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newInvite.email.trim()}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{error}</div>}
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" placeholder="user@company.com" value={newInvite.email} onChange={(e) => setNewInvite((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Роль</label>
            <select className="select" value={newInvite.role} onChange={(e) => setNewInvite((f) => ({ ...f, role: e.target.value as 'consultant' | 'factory', factoryId: '' }))}>
              <option value="consultant">Консультант</option>
              <option value="factory">Завод (администратор завода)</option>
            </select>
          </div>
          {newInvite.role === 'factory' && (
            <div>
              <label className="label">Завод, которым будет управлять</label>
              <select className="select" value={newInvite.factoryId} onChange={(e) => setNewInvite((f) => ({ ...f, factoryId: e.target.value }))}>
                <option value="">— не привязывать —</option>
                {factories.map((f) => <option key={f.id} value={f.id}>{f.name}{f.province ? ` (${f.province})` : ''}</option>)}
              </select>
              <p className="section-muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                Выбранный завод авто-привяжется к новому администратору при регистрации по ссылке.
                Если завода ещё нет — создайте его в разделе «Заводы».
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
