import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { consultantsApi } from '../../api/consultants';
import { categoriesApi } from '../../api/categories';
import type { Category, ConsultantProfile } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

const TYPE_LABELS: Record<string, string> = { specialized: 'Специализированный', general: 'Универсальный' };

export function ConsultantsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories: Category[] = catData || [];

  const { data, isLoading } = useQuery({
    queryKey: ['consultants', { search, category, page }],
    queryFn: () => consultantsApi.list({ search, categoryId: category || undefined, page, limit }),
  });

  const consultants: ConsultantProfile[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div style={{ padding: '56px 0' }}>
      <div className="wrap">
        <div style={{ marginBottom: 40 }}>
          <div className="eyebrow">Консультанты</div>
          <h1 style={{ fontSize: 'clamp(30px,4vw,48px)', fontWeight: 800, marginTop: 12 }}>Ваш человек в Китае</h1>
          <p className="section-muted" style={{ fontSize: 17, marginTop: 12, maxWidth: 560 }}>
            Проверенные специалисты с реальным опытом закупок. Рейтинг строится только на закрытых заказах.
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ maxWidth: 280 }}
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={`tag ${!category ? 'tag-active' : ''}`}
              onClick={() => { setCategory(''); setPage(1); }}
            >
              Все категории
            </button>
            {categories.slice(0, 8).map((c: Category) => (
              <button
                key={c.id}
                className={`tag ${category === c.id ? 'tag-active' : ''}`}
                onClick={() => { setCategory(category === c.id ? '' : c.id); setPage(1); }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span className="section-muted" style={{ fontSize: 14 }}>
            {isLoading ? 'Загрузка...' : `${total} консультантов`}
          </span>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : consultants.length === 0 ? (
          <EmptyState title="Консультанты не найдены" description="Попробуйте изменить фильтры" icon="🤝" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
              {consultants.map((c: ConsultantProfile) => (
                <Link key={c.id} to={`/consultant/${c.id}`} className="card card-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <Avatar name={c.user?.name} src={c.user?.avatarUrl} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{c.user?.name}</span>
                        {c.verified && <span className="badge badge-accent" style={{ fontSize: 11 }}>✓</span>}
                      </div>
                      <div className="section-muted" style={{ fontSize: 13, marginTop: 2 }}>
                        {TYPE_LABELS[c.type] || 'Консультант'}
                        {c.years > 0 && ` · ${c.years} лет опыта`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--warn)' }}>⭐ {c.rating.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: 'var(--faint)' }}>{c.reviewsCount} отзывов</div>
                    </div>
                  </div>

                  {c.bio && (
                    <p className="section-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                      {c.bio.slice(0, 100)}{c.bio.length > 100 ? '…' : ''}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(c.categories || []).slice(0, 3).map((cc) => (
                      <span key={cc.category.id} className="tag" style={{ fontSize: 12, padding: '4px 9px' }}>{cc.category.name}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--ink-2)', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <span>📦 {c.dealsClosed} заказов</span>
                    {c.responseTime && <span>⏱️ {c.responseTime}</span>}
                    {(c.languages?.length ?? 0) > 0 && <span>🌐 {c.languages.join(', ')}</span>}
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
