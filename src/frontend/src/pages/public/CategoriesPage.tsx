import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../api/categories';
import type { Category } from '../../api/types';
import { PageSpinner } from '../../components/ui/Spinner';

export function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories: Category[] = data || [];

  return (
    <div style={{ padding: '56px 0' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="eyebrow">Все категории</div>
          <h1 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, marginTop: 14 }}>Найдите поставщика<br />в нужной категории</h1>
          <p className="section-muted" style={{ fontSize: 17, marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>
            {categories.length} категорий товаров от проверенных китайских заводов
          </p>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {categories.map((c: Category) => {
              const hue = c.hue || 222;
              return (
                <Link
                  key={c.id}
                  to={`/category/${c.id}`}
                  className="card card-hover cat-tile"
                  style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, '--h': hue } as React.CSSProperties}
                >
                  <span className="cat-stripe" style={{ background: `linear-gradient(90deg, hsl(${hue} 70% 50%), hsl(${(hue + 30) % 360} 70% 55%))` }} />
                  <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 24 }}>
                    📦
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{c.name}</div>
                    {c.blurb && <p className="section-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{c.blurb}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                    <span className="badge">{c.factoryCount} заводов</span>
                    <span className="cat-arrow" style={{ marginLeft: 'auto' }}>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
