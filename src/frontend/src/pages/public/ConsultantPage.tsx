import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { consultantsApi } from '../../api/consultants';
import type { Review } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { PageSpinner } from '../../components/ui/Spinner';

const TYPE_LABELS: Record<string, string> = { specialized: 'Специализированный', general: 'Универсальный' };

export function ConsultantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();

  const { data: consultant, isLoading } = useQuery({
    queryKey: ['consultant', id],
    queryFn: () => consultantsApi.get(id!),
    enabled: !!id,
  });

  const { data: reviewData } = useQuery({
    queryKey: ['consultant-reviews', id],
    queryFn: () => consultantsApi.getReviews(id!, { limit: 5 }),
    enabled: !!id,
  });

  const reviews: Review[] = reviewData?.items || [];
  const factories = (consultant?.factories || []).map((f) => f.factory);

  if (isLoading) return <PageSpinner />;
  if (!consultant) return <div className="wrap" style={{ padding: '60px 0', textAlign: 'center' }}>Консультант не найден</div>;

  const consultantName = consultant.user?.name || 'Консультант';

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
          <Link to="/">Главная</Link>
          <span>›</span>
          <Link to="/consultants">Консультанты</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{consultantName}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Profile card */}
            <div className="card" style={{ padding: '32px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <Avatar name={consultantName} src={consultant.user?.avatarUrl} size={72} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,2.5vw,28px)' }}>{consultantName}</h1>
                    {consultant.verified && <span className="badge badge-accent">✓ Верифицирован</span>}
                  </div>
                  <div className="section-muted" style={{ fontSize: 14, marginTop: 4 }}>
                    {TYPE_LABELS[consultant.type] || 'Консультант'}
                    {consultant.years > 0 && ` · ${consultant.years} лет опыта`}
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--warn)' }}>⭐ {consultant.rating.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{consultant.reviewsCount} отзывов</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>{consultant.dealsClosed}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>заказов</div>
                    </div>
                    {consultant.responseTime && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>{consultant.responseTime}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>время ответа</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {consultant.bio && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>{consultant.bio}</p>
                </div>
              )}

              {(consultant.categories?.length ?? 0) > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 8 }}>СПЕЦИАЛИЗАЦИЯ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(consultant.categories || []).map((cc) => <span key={cc.category.id} className="tag">{cc.category.name}</span>)}
                  </div>
                </div>
              )}

              {(consultant.languages?.length ?? 0) > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 8 }}>ЯЗЫКИ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {consultant.languages.map((lang: string) => <span key={lang} className="badge">{lang}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Linked factories */}
            {factories.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Связанные заводы</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {factories.map((f) => (
                    <Link key={f.id} to={`/factory/${f.id}`} className="card card-hover" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                      <span style={{ fontSize: 24 }}>🏭</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                        <div className="section-muted" style={{ fontSize: 12 }}>{f.city || ''}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Отзывы</h2>
              {reviews.length === 0 ? (
                <p className="section-muted">Пока нет отзывов</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map((r: Review) => (
                    <div key={r.id} style={{ display: 'flex', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                      <Avatar name={r.author?.name || '?'} src={r.author?.avatarUrl} size={40} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{r.author?.name || 'Аноним'}</span>
                          <span style={{ color: 'var(--warn)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        </div>
                        {r.text && <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{r.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar CTA */}
          <div className="card" style={{ padding: 22, position: 'sticky', top: 80 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Работать с {consultantName.split(' ')[0]}</h3>
            <p className="section-muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Создайте заявку и {consultantName.split(' ')[0]} возьмёт её в работу — согласует условия с заводом и подготовит оффер.
            </p>
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
  );
}
