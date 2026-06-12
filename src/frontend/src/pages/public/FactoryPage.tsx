import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '../../api/factories';
import type { Product, Certificate } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../../components/ui/Spinner';

export function FactoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();

  const { data: factory, isLoading } = useQuery({
    queryKey: ['factory', id],
    queryFn: () => factoriesApi.get(id!),
    enabled: !!id,
  });

  const products: Product[] = (factory?.products || []).filter((p) => p.active);
  const certs: Certificate[] = factory?.certs || [];

  if (isLoading) return <PageSpinner />;
  if (!factory) return <div className="wrap" style={{ padding: '60px 0', textAlign: 'center' }}>Завод не найден</div>;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="wrap">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
          <Link to="/">Главная</Link>
          <span>›</span>
          <Link to="/catalog">Каталог</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{factory.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Hero */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: 220, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
                {factory.photoUrls?.[0] ? <img src={factory.photoUrls[0]} alt={factory.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏭'}
              </div>
              <div style={{ padding: '24px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 26, border: '1px solid var(--line)' }}>
                    🏭
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,2.5vw,30px)' }}>{factory.name}</h1>
                      {factory.verified && <span className="badge badge-accent">✓ Верифицирован</span>}
                    </div>
                    <div className="section-muted" style={{ fontSize: 14, marginTop: 4 }}>
                      {factory.province}{factory.city ? `, ${factory.city}` : ''}{factory.established ? ` · Основан ${factory.established}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>{factory._count?.orders ?? 0}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>заказов</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {factory.about && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 14 }}>О заводе</h2>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>{factory.about}</p>
              </div>
            )}

            {/* Products */}
            {products.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Продукты</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {products.map((p: Product) => (
                    <div key={p.id} className="card" style={{ padding: 14 }}>
                      <div style={{ height: 100, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div className="section-muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {p.priceLo != null && p.priceHi != null ? `$${p.priceLo}–${p.priceHi}` : ''}
                        {p.moq ? ` · MOQ ${p.moq}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Быстрая информация</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['🏙️', 'Регион', factory.province || 'Н/д'],
                  ['👥', 'Сотрудников', factory.staff || 'Н/д'],
                  ['⏱️', 'Срок производства', factory.leadTime || 'Уточнить'],
                  ['📐', 'Площадь', factory.area || 'Н/д'],
                ].map(([icon, label, value]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {certs.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 8 }}>СЕРТИФИКАТЫ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {certs.map((cert: Certificate) => (
                      <span key={cert.id} className="badge badge-ok">{cert.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                {isAuthenticated && isClient ? (
                  <button className="btn btn-primary btn-block" onClick={() => navigate('/dashboard/requests/new')}>
                    Создать запрос
                  </button>
                ) : !isAuthenticated ? (
                  <Link to="/register" className="btn btn-primary btn-block" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    Начать бесплатно
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
