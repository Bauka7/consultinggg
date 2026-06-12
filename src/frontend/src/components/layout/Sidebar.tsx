import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/theme.store';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const CLIENT_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Обзор', icon: '⊞' },
  { to: '/dashboard/requests', label: 'Мои запросы', icon: '📋' },
  { to: '/dashboard/offers', label: 'Офферы', icon: '💼' },
  { to: '/dashboard/orders', label: 'Заказы', icon: '📦' },
  { to: '/dashboard/messages', label: 'Сообщения', icon: '💬' },
  { to: '/dashboard/profile', label: 'Профиль', icon: '👤' },
];

const CONSULTANT_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Обзор', icon: '⊞' },
  { to: '/dashboard/requests', label: 'Запросы', icon: '📋' },
  { to: '/dashboard/offers', label: 'Офферы', icon: '💼' },
  { to: '/dashboard/orders', label: 'Заказы', icon: '📦' },
  { to: '/dashboard/factories', label: 'Заводы', icon: '🏭' },
  { to: '/dashboard/messages', label: 'Сообщения', icon: '💬' },
  { to: '/dashboard/profile', label: 'Профиль', icon: '👤' },
];

const FACTORY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Обзор', icon: '⊞' },
  { to: '/dashboard/orders', label: 'Заказы', icon: '📦' },
  { to: '/dashboard/products', label: 'Продукты', icon: '🛍️' },
  { to: '/dashboard/certs', label: 'Сертификаты', icon: '📜' },
  { to: '/dashboard/consultants', label: 'Консультанты', icon: '🤝' },
  { to: '/dashboard/profile', label: 'Профиль завода', icon: '🏭' },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Обзор', icon: '⊞' },
  { to: '/dashboard/users', label: 'Пользователи', icon: '👥' },
  { to: '/dashboard/factories', label: 'Заводы', icon: '🏭' },
  { to: '/dashboard/consultant-applications', label: 'Заявки конс.', icon: '📝' },
  { to: '/dashboard/invites', label: 'Приглашения', icon: '✉️' },
  { to: '/dashboard/reviews', label: 'Отзывы', icon: '⭐' },
  { to: '/dashboard/audit', label: 'Аудит', icon: '🔍' },
  { to: '/dashboard/settings', label: 'Настройки', icon: '⚙️' },
];

const ROLE_NAV: Record<string, NavItem[]> = {
  client: CLIENT_NAV,
  consultant: CONSULTANT_NAV,
  factory_admin: FACTORY_NAV,
  platform_admin: ADMIN_NAV,
};

const ROLE_LABELS: Record<string, string> = {
  client: 'Клиент',
  consultant: 'Консультант',
  factory_admin: 'Завод',
  platform_admin: 'Администратор',
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleDirection, direction } = useThemeStore();
  const nav = ROLE_NAV[user?.role || 'client'] || CLIENT_NAV;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <aside className="dash-sidebar">
      <div className="dash-logo">
        <div className="dash-logo-mark">T</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>Tradewind</div>
          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{ROLE_LABELS[user?.role || 'client']}</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) => clsx('dash-nav-item', isActive && 'active')}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={toggleDirection}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
        >
          {direction === 'warm' ? '☀️ Warm' : '🏢 Corp'}
        </button>
        <button onClick={handleLogout} className="btn btn-quiet btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          Выйти
        </button>
      </div>
    </aside>
  );
}
