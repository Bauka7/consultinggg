import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';

export function RegisterCustomerPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({ ...form, role: 'client' });
      setAuth(res.user as any, res.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>T</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Tradewind</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Создать аккаунт</h1>
          <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Начните закупать из Китая без рисков</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{error}</div>}

          <div>
            <label className="label" htmlFor="name">Ваше имя</label>
            <input id="name" type="text" className="input" placeholder="Иван Петров" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="company">Компания (необязательно)</label>
            <input id="company" type="text" className="input" placeholder="ООО Пример" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@company.com" value={form.email} onChange={(e) => set('email', e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Пароль</label>
            <input id="password" type="password" className="input" placeholder="Минимум 8 символов" value={form.password} onChange={(e) => set('password', e.target.value)} required autoComplete="new-password" />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center' }}>
            Регистрируясь, вы соглашаетесь с условиями использования
          </p>

          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
