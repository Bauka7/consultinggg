import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)', borderTop: '1px solid var(--line)',
      padding: '48px 0 32px',
    }}>
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--r-md)',
                background: 'var(--accent-grad)', display: 'grid', placeItems: 'center',
                color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
              }}>T</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Tradewind</span>
            </div>
            <p className="section-muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
              B2B платформа для безопасных закупок из Китая через проверенных консультантов.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--ink-2)' }}>Платформа</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/', 'Главная'], ['/catalog', 'Каталог заводов'], ['/consultants', 'Консультанты'], ['/categories', 'Категории']].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: 14, color: 'var(--muted)' }}>{label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--ink-2)' }}>Аккаунт</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/login', 'Войти'], ['/register', 'Зарегистрироваться'], ['/register/consultant', 'Стать консультантом']].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: 14, color: 'var(--muted)' }}>{label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--ink-2)' }}>Компания</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['#', 'О нас'], ['#', 'Для бизнеса'], ['#', 'Контакты'], ['#', 'Политика конфиденциальности']].map(([to, label]) => (
                <a key={label} href={to} style={{ fontSize: 14, color: 'var(--muted)' }}>{label}</a>
              ))}
            </nav>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-muted" style={{ fontSize: 13 }}>© 2025 Tradewind. Все права защищены.</span>
          <span className="section-muted" style={{ fontSize: 13 }}>1240 заводов · 86 консультантов · 38 стран</span>
        </div>
      </div>
    </footer>
  );
}
