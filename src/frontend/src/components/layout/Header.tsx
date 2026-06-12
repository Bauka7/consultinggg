import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/theme.store';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { direction, toggleDirection } = useThemeStore();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="pub-header">
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--r-md)',
            background: 'var(--accent-grad)', display: 'grid', placeItems: 'center',
            color: 'var(--accent-ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
          }}>T</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-.02em' }}>
            Tradewind
          </span>
        </Link>

        <nav className="pub-nav">
          <NavLink to="/catalog">Заводы</NavLink>
          <NavLink to="/consultants">Консультанты</NavLink>
          <NavLink to="/categories">Категории</NavLink>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleDirection}
            className="btn btn-ghost btn-sm"
            style={{ padding: '7px 12px', fontSize: 12 }}
            title={direction === 'warm' ? 'Переключить на Corporate' : 'Переключить на Warm'}
          >
            {direction === 'warm' ? '☀️ Warm' : '🏢 Corp'}
          </button>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                Панель
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                }}>
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <button onClick={handleLogout} className="btn btn-quiet btn-sm">
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Войти</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Начать</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
