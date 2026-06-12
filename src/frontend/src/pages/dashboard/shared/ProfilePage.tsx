import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/users';
import { useAuthStore } from '../../../store/auth.store';
import { PageSpinner } from '../../../components/ui/Spinner';

const ROLE_LABEL: Record<string, string> = {
  client: 'Клиент',
  consultant: 'Консультант',
  factory_admin: 'Завод',
  platform_admin: 'Администратор',
};

export function ProfilePage() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getMe(),
  });

  const [form, setForm] = useState({ name: '', phone: '', city: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '' });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe(form),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user && accessToken) {
        setAuth({ ...user, name: res.name }, accessToken);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const pwMutation = useMutation({
    mutationFn: () => usersApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    onSuccess: () => {
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    },
    onError: (err: any) => {
      setPwError(err.response?.data?.message || 'Ошибка смены пароля');
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Профиль</h1>

      {/* Avatar */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{profile?.name}</div>
            <div className="section-muted" style={{ fontSize: 14 }}>{profile?.email}</div>
            <span className="badge badge-accent" style={{ marginTop: 6 }}>{ROLE_LABEL[profile?.role || ''] || profile?.role}</span>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Личные данные</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Имя</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Телефон</label>
            <input className="input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+7 999 000 00 00" />
          </div>
          <div>
            <label className="label">Город</label>
            <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Москва" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            {saved && <span style={{ color: 'var(--ok)', fontSize: 14 }}>✓ Сохранено</span>}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Изменить пароль</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pwError && <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{pwError}</div>}
          <div>
            <label className="label">Текущий пароль</label>
            <input className="input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Новый пароль</label>
            <input className="input" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Подтвердите новый пароль</label>
            <input className="input" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (pwForm.newPassword !== pwForm.confirm) { setPwError('Пароли не совпадают'); return; }
                setPwError('');
                pwMutation.mutate();
              }}
              disabled={pwMutation.isPending}
            >
              {pwMutation.isPending ? 'Изменение...' : 'Изменить пароль'}
            </button>
            {pwSaved && <span style={{ color: 'var(--ok)', fontSize: 14 }}>✓ Пароль изменён</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
