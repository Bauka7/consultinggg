import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invitesApi } from '../../api/invites';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';
import { PageSpinner } from '../../components/ui/Spinner';

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => invitesApi.validate(token!),
    enabled: !!token,
  });

  const invite = data;
  const valid = invite?.valid;

  useEffect(() => {
    if (invite?.email) {
      setForm((f) => ({ ...f, email: invite.email || '' }));
    }
  }, [invite?.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.registerWithInvite({ inviteToken: token!, name: form.name, email: form.email, password: form.password });
      setAuth(res.user as any, res.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка принятия приглашения');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>T</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Tradewind</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Приглашение</h1>
          <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>
            {valid ? `Вас приглашают как ${invite?.role === 'consultant' ? 'консультанта' : 'пользователя'}` : 'Приглашение недействительно'}
          </p>
        </div>

        <div className="card" style={{ padding: '32px 28px' }}>
          {!valid ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
              <p className="section-muted">Ссылка приглашения недействительна или истекла</p>
              <Link to="/register" className="btn btn-primary btn-block" style={{ marginTop: 16, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                Зарегистрироваться
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{error}</div>}
              <div>
                <label className="label">Ваше имя</label>
                <input type="text" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required disabled={!!invite?.email} />
              </div>
              <div>
                <label className="label">Пароль</label>
                <input type="password" className="input" placeholder="Минимум 8 символов" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Создание аккаунта...' : 'Принять приглашение'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
