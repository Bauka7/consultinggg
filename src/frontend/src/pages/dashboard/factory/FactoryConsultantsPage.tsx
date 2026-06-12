import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '../../../api/factories';
import { Avatar } from '../../../components/ui/Avatar';
import { PageSpinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';

export function FactoryConsultantsPage() {
  const { data: factory, isLoading } = useQuery({
    queryKey: ['factory-my'],
    queryFn: () => factoriesApi.myFactory(),
  });

  const consultants = (factory?.consultants || []).map((c) => c.consultant);

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Консультанты завода</h1>
      <p className="section-muted" style={{ fontSize: 15, marginBottom: 24 }}>
        Консультанты, привязанные к вашему заводу — они ведут переговоры с клиентами от вашего имени
      </p>

      {isLoading ? (
        <PageSpinner />
      ) : consultants.length === 0 ? (
        <EmptyState
          title="Консультантов пока нет"
          description="Консультанты подают заявку на привязку к заводу — одобренные появятся здесь"
          icon="🤝"
          action={<Link to="/consultants" className="btn btn-ghost btn-sm">Посмотреть всех консультантов</Link>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {consultants.map((c) => (
            <Link key={c.id} to={`/consultant/${c.id}`} className="card card-hover" style={{ padding: 20, display: 'flex', gap: 14, textDecoration: 'none', color: 'inherit' }}>
              <Avatar name={c.user?.name} src={c.user?.avatarUrl} size={48} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.user?.name}</div>
                <div className="section-muted" style={{ fontSize: 13 }}>⭐ {c.rating?.toFixed(1)} · {c.dealsClosed} сделок</div>
                {c.verified && <span className="badge badge-ok" style={{ marginTop: 8 }}>✓ Верифицирован</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
