import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    if (password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ссылка недействительна или истекла');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>T</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Tradewind</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Новый пароль</h1>
        </div>

        <div className="card" style={{ padding: '32px 28px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Пароль изменён!</h2>
              <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Перенаправляем на страницу входа...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{error}</div>}
              {!token && <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--warn-soft)', color: 'var(--warn)', fontSize: 14 }}>Недействительная ссылка</div>}
              <div>
                <label className="label">Новый пароль</label>
                <input type="password" className="input" placeholder="Минимум 8 символов" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!token} />
              </div>
              <div>
                <label className="label">Подтвердите пароль</label>
                <input type="password" className="input" placeholder="Повторите пароль" value={confirm} onChange={(e) => setConfirm(e.target.value)} required disabled={!token} />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || !token}>
                {loading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
