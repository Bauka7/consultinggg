import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../api/categories';
import { factoriesApi } from '../../api/factories';
import type { Factory } from '../../api/types';
import { Pagination } from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: catData } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.get(id!),
    enabled: !!id,
  });

  const category = catData;

  const { data, isLoading } = useQuery({
    queryKey: ['factories', { category: id, page }],
    queryFn: () => factoriesApi.list({ categoryId: id, page, limit }),
    enabled: !!id,
  });

  const factories: Factory[] = data?.items || [];
  const total = data?.total || 0;
  const hue = category?.hue || 222;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="wrap">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
          <Link to="/">Главная</Link>
          <span>›</span>
          <Link to="/categories">Категории</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{category?.name || '...'}</span>
        </div>

        {/* Category header */}
        {category && (
          <div style={{
            marginBottom: 40, padding: '32px 36px',
            borderRadius: 'var(--r-xl)', overflow: 'hidden', position: 'relative',
            background: `hsl(${hue} 60% 96%)`, border: `1px solid hsl(${hue} 40% 88%)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--r-lg)', background: `hsl(${hue} 70% 88%)`, color: `hsl(${hue} 60% 38%)`, display: 'grid', placeItems: 'center', fontSize: 28, flexShrink: 0 }}>📦</div>
              <div>
                <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: `hsl(${hue} 50% 28%)` }}>{category.name}</h1>
                {category.blurb && <p style={{ fontSize: 15, marginTop: 6, color: `hsl(${hue} 30% 40%)` }}>{category.blurb}</p>}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: `hsl(${hue} 50% 30%)` }}>{category.factoryCount}</div>
                  <div style={{ fontSize: 13, color: `hsl(${hue} 30% 50%)` }}>Заводов</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? <PageSpinner /> : factories.length === 0 ? (
          <EmptyState title="Заводов в этой категории нет" icon="🏭" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 28 }}>
              {factories.map((f: Factory) => (
                <Link key={f.id} to={`/factory/${f.id}`} className="card card-hover fac-card" style={{ textDecoration: 'none' }}>
                  <div style={{ height: 148, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                    {f.photoUrls?.[0] ? <img src={f.photoUrls[0]} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏭'}
                  </div>
                  <div className="fac-card-body">
                    <div className="fac-card-name">{f.name}</div>
                    <div className="section-muted" style={{ fontSize: 13 }}>{f.province}</div>
                    <div className="fac-card-meta">
                      {f.verified && <span className="badge badge-accent">✓ Верифицирован</span>}
                      {f.leadTime && <span className="badge">{f.leadTime}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination page={page} total={total} limit={limit} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
