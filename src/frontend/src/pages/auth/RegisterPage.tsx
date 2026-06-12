import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>T</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>Tradewind</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Создать аккаунт</h1>
          <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Выберите тип аккаунта</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            className="card card-hover"
            onClick={() => navigate('/register/customer')}
            style={{ padding: '22px 24px', textAlign: 'left', display: 'flex', gap: 18, alignItems: 'flex-start', cursor: 'pointer', background: 'none', border: '1px solid var(--line)' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0 }}>🛒</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 5 }}>Я закупаю товары</div>
              <p className="section-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>Ищу проверенные заводы и консультантов для импорта из Китая</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--accent)', alignSelf: 'center' }}>→</span>
          </button>

          <button
            className="card card-hover"
            onClick={() => navigate('/register/consultant')}
            style={{ padding: '22px 24px', textAlign: 'left', display: 'flex', gap: 18, alignItems: 'flex-start', cursor: 'pointer', background: 'none', border: '1px solid var(--line)' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0 }}>🤝</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 5 }}>Я консультант</div>
              <p className="section-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>Работаю с заводами, помогаю клиентам с закупками и переговорами</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--accent)', alignSelf: 'center' }}>→</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', marginTop: 20 }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
