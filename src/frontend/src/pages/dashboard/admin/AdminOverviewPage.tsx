import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin';
import { PageSpinner } from '../../../components/ui/Spinner';

export function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboard(),
    refetchInterval: 60000,
  });

  const stats = data;

  if (isLoading) return <PageSpinner />;

  const statCards = [
    { icon: '👥', label: 'Пользователей', value: stats?.totalUsers || 0, hue: 222, to: '/dashboard/users' },
    { icon: '🏭', label: 'Заводов', value: stats?.totalFactories || 0, hue: 96, to: '/dashboard/factories' },
    { icon: '🤝', label: 'Консультантов', value: stats?.totalConsultants || 0, hue: 38, to: '/dashboard/consultant-applications' },
    { icon: '📦', label: 'Всего заказов', value: stats?.totalOrders || 0, hue: 256, to: '/dashboard/orders' },
    { icon: '⚙️', label: 'Активных заказов', value: stats?.activeOrders || 0, hue: 150, to: '/dashboard/orders' },
    { icon: '📝', label: 'Заявок консультантов', value: stats?.pendingApplications || 0, hue: 0, to: '/dashboard/consultant-applications' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }}>Панель администратора</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {statCards.map((s) => (
          <Link key={s.label} to={s.to} className="card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `hsl(${s.hue} 70% 94%)`, color: `hsl(${s.hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 20 }}>{s.icon}</div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Быстрые действия</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/dashboard/consultant-applications" className="btn btn-ghost">📝 Заявки консультантов</Link>
          <Link to="/dashboard/invites" className="btn btn-ghost">✉️ Пригласить пользователя</Link>
          <Link to="/dashboard/users" className="btn btn-ghost">👥 Управление пользователями</Link>
          <Link to="/dashboard/settings" className="btn btn-ghost">⚙️ Настройки платформы</Link>
          <Link to="/dashboard/audit" className="btn btn-ghost">🔍 Журнал аудита</Link>
        </div>
      </div>
    </div>
  );
}
