import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '../../api/factories';
import { categoriesApi } from '../../api/categories';
import type { Category, Factory } from '../../api/types';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';

const PROVINCES = ['Гуандун', 'Чжэцзян', 'Цзянсу', 'Шанхай', 'Шаньдун', 'Хэбэй', 'Фуцзянь', 'Хунань'];

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories: Category[] = catData || [];

  const { data, isLoading } = useQuery({
    queryKey: ['factories', { search, category, province, page }],
    queryFn: () => factoriesApi.list({ search, categoryId: category || undefined, province: province || undefined, page, limit }),
  });

  const factories: Factory[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="wrap">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 800 }}>Каталог заводов</h1>
          <p className="section-muted" style={{ fontSize: 16, marginTop: 8 }}>
            {total > 0 ? `${total} проверенных поставщиков` : 'Проверенные поставщики из Китая'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>
          {/* Sidebar filters */}
          <aside className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Фильтры</div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Поиск</label>
              <input
                className="input"
                placeholder="Название завода..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Провинция</label>
              <select className="select" value={province} onChange={(e) => { setProvince(e.target.value); setPage(1); }}>
                <option value="">Все провинции</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="label" style={{ marginBottom: 10 }}>Категории</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.slice(0, 12).map((c: Category) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={category === c.id}
                      onChange={(e) => { setCategory(e.target.checked ? c.id : ''); setPage(1); }}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span>{c.name}</span>
                    <span className="section-muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{c.factoryCount}</span>
                  </label>
                ))}
              </div>
            </div>

            {(search || category || province) && (
              <button
                className="btn btn-ghost btn-sm btn-block"
                style={{ marginTop: 16 }}
                onClick={() => { setSearch(''); setCategory(''); setProvince(''); setPage(1); }}
              >
                Сбросить фильтры
              </button>
            )}
          </aside>

          {/* Results */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span className="section-muted" style={{ fontSize: 14 }}>
                {isLoading ? 'Загрузка...' : `${total} заводов`}
              </span>
            </div>

            {isLoading ? (
              <PageSpinner />
            ) : factories.length === 0 ? (
              <EmptyState
                title="Заводы не найдены"
                description="Попробуйте изменить фильтры или поисковый запрос"
                icon="🏭"
              />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                  {factories.map((f: Factory) => (
                    <Link key={f.id} to={`/factory/${f.id}`} className="card card-hover fac-card" style={{ textDecoration: 'none' }}>
                      <div style={{ height: 148, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                        {f.photoUrls?.[0] ? <img src={f.photoUrls[0]} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏭'}
                      </div>
                      <div className="fac-card-body">
                        <div className="fac-card-name">{f.name}</div>
                        <div className="section-muted" style={{ fontSize: 13 }}>{f.province}{f.city ? ` · ${f.city}` : ''}</div>
                        {(f.categories?.length ?? 0) > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(f.categories || []).slice(0, 3).map((cc) => (
                              <span key={cc.category.id} className="tag" style={{ fontSize: 11.5, padding: '3px 8px' }}>{cc.category.name}</span>
                            ))}
                          </div>
                        )}
                        <div className="fac-card-meta">
                          {f.verified && <span className="badge badge-accent">✓ Верифицирован</span>}
                          {f.leadTime && <span className="badge">{f.leadTime}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                  <Pagination page={page} total={total} limit={limit} onChange={setPage} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
