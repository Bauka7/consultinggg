import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';

export function ApplyConsultantPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', experience: '', linkedinUrl: '' });
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
      const res = await authApi.register({ name: form.name, email: form.email, password: form.password, role: 'consultant' });
      setAuth(res.user as any, res.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки заявки');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>T</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Tradewind</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Стать консультантом</h1>
          <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Зарабатывайте, помогая бизнесу закупать из Китая</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--ok-soft)', border: '1px solid transparent' }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <p style={{ fontSize: 13.5, color: 'var(--ok)', lineHeight: 1.5 }}>
            Заявка проходит проверку. Первые {'{'}trialOrdersCount{'}'} заказа — испытательный период. Рейтинг ниже 3.0 после 10 отзывов ведёт к блокировке.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{error}</div>}

          <div>
            <label className="label">Ваше имя</label>
            <input type="text" className="input" placeholder="Иван Петров" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input type="password" className="input" placeholder="Минимум 8 символов" value={form.password} onChange={(e) => set('password', e.target.value)} required />
          </div>
          <div>
            <label className="label">О себе</label>
            <textarea className="input" placeholder="Опыт работы с Китаем, специализация, достижения..." value={form.bio} onChange={(e) => set('bio', e.target.value)} style={{ minHeight: 96, resize: 'vertical' }} />
          </div>
          <div>
            <label className="label">Опыт (лет)</label>
            <input type="text" className="input" placeholder="5 лет работы с китайскими заводами" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
          </div>
          <div>
            <label className="label">LinkedIn (необязательно)</label>
            <input type="url" className="input" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Отправка заявки...' : 'Подать заявку'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Уже есть аккаунт? Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
