import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../api/categories';
import { factoriesApi } from '../../api/factories';
import { consultantsApi } from '../../api/consultants';
import type { Category, Factory, ConsultantProfile } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';

/* ---- Animated bridge flow ---- */
function BridgeFlow() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 4), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card" style={{ padding: '30px 26px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .5, background: 'radial-gradient(90% 70% at 50% 0%, var(--accent-soft), transparent 70%)' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <TrustNode icon="👤" label="Вы" sub="Клиент" active={step >= 0} dim={step !== 0 && step !== 3} />
        <Connector active={step >= 1} />
        <TrustNode icon="🛡️" label="Консультант" sub="Ваш агент" active={step >= 1} dim={step < 1} />
        <Connector active={step >= 2} />
        <TrustNode icon="🏭" label="Завод" sub="Проверен" active={step >= 2} dim={step < 2} />
      </div>
      <div style={{ position: 'relative', marginTop: 22, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--accent)', fontSize: 16 }}>🔒</span>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>
          Вы никогда не общаетесь с заводом напрямую. Консультант берёт на себя язык, цену и качество.
        </span>
      </div>
    </div>
  );
}

function TrustNode({ icon, label, sub, active, dim }: { icon: string; label: string; sub: string; active: boolean; dim: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: dim ? 0.4 : 1, transition: 'opacity .5s' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--r-lg)',
        background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
        border: `2px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
        display: 'grid', placeItems: 'center', fontSize: 24,
        transition: 'all .5s',
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div className="section-muted" style={{ fontSize: 12 }}>{sub}</div>
      </div>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div style={{ flex: 1, height: 2, marginTop: 26, background: 'var(--line-2)', position: 'relative', borderRadius: 2, marginInline: 4 }}>
      <div style={{ position: 'absolute', inset: 0, width: active ? '100%' : '0%', background: 'var(--accent)', transition: 'width .7s var(--ease)', borderRadius: 2 }} />
    </div>
  );
}

/* ---- Hero ---- */
function Hero() {
  const [cat, setCat] = useState('');
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() });
  const categories: Category[] = data || [];

  return (
    <section style={{ background: 'var(--hero-grad)', paddingTop: 56, paddingBottom: 72, position: 'relative', overflow: 'hidden' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 6px 6px 14px', borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1px solid var(--line-2)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>1240 проверенных заводов</span>
            <span style={{ width: 1, height: 14, background: 'var(--line-2)' }} />
            <span className="badge badge-accent" style={{ fontSize: 11.5 }}>🛡️ Никакого прямого контакта</span>
          </div>
          <h1 className="fade-up" style={{ fontSize: 'clamp(40px, 5vw, 62px)', fontWeight: 800, lineHeight: .98, animationDelay: '.05s' }}>
            Закупки из Китая,<br /><span style={{ color: 'var(--accent)' }}>без рисков.</span>
          </h1>
          <p className="fade-up section-muted" style={{ fontSize: 19, marginTop: 22, maxWidth: 520, lineHeight: 1.55, animationDelay: '.12s' }}>
            Находите проверенные заводы и заказывайте оптом через доверенного консультанта, который знает язык, специфику переговоров и защищает каждый шаг.
          </p>
          <div className="fade-up" style={{ marginTop: 28, animationDelay: '.18s', display: 'flex', gap: 8, background: 'var(--surface)', padding: 8, borderRadius: 'var(--r-full)', border: '1px solid var(--line-2)', boxShadow: 'var(--shadow-md)', maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 14, flex: 1 }}>
              <span style={{ color: 'var(--faint)', fontSize: 18 }}>🔍</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ border: 'none', background: 'transparent', flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, color: cat ? 'var(--ink)' : 'var(--faint)', outline: 'none', cursor: 'pointer' }}>
                <option value="">Что хотите закупить?</option>
                {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(cat ? `/category/${cat}` : '/catalog')}>
              Найти →
            </button>
          </div>
          <div className="fade-up" style={{ display: 'flex', gap: 24, marginTop: 26, animationDelay: '.24s' }}>
            {[['1240', 'Проверенных заводов'], ['86', 'Консультантов'], ['4.8★', 'Средний рейтинг']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>{n}</div>
                <div className="section-muted" style={{ fontSize: 13 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="fade-up" style={{ animationDelay: '.2s' }}>
          <BridgeFlow />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            {[['💬', 'Двойной чат', 'Клиент + скрытая линия завода'], ['🚚', 'Трекинг', 'Черновик → Доставлено → Закрыто']].map(([icon, title, sub]) => (
              <div key={title} className="card" style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>{icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
                  <div className="section-muted" style={{ fontSize: 12.5 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Trust strip ---- */
function TrustStrip() {
  return (
    <div style={{ borderBlock: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div className="wrap" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="section-muted" style={{ fontSize: 13, fontWeight: 600 }}>Нам доверяют закупки в категориях</span>
        {['Электроника', 'Одежда', 'Косметика', 'Мебель', 'Упаковка', 'Автозапчасти'].map((t) => (
          <span key={t} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--faint)' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ---- How it works ---- */
function HowItWorks() {
  const steps = [
    { n: '01', icon: '🔍', hue: 222, t: 'Найдите завод', d: 'Просмотрите 1240 проверенных заводов или выберите консультанта по вашему товару.' },
    { n: '02', icon: '💬', hue: 268, t: 'Создайте запрос', d: 'Товар, количество, срок, бюджет. Консультант берёт запрос в работу за часы.' },
    { n: '03', icon: '🛡️', hue: 178, t: 'Он ведёт переговоры', d: 'По скрытой линии с заводом согласует цену, MOQ, качество и доставку.' },
    { n: '04', icon: '📄', hue: 28, t: 'Примите оффер', d: 'Один понятный оффер — итоговая цена, срок, условия. Принять или пересмотреть.' },
    { n: '05', icon: '🚚', hue: 96, t: 'Отследите до двери', d: 'Видите каждое изменение статуса и получаете трекинг-номер в реальном времени.' },
  ];

  return (
    <section id="how" style={{ padding: '90px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 44, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 540 }}>
            <div className="eyebrow">Как это работает</div>
            <h2 style={{ fontSize: 'clamp(30px,3.6vw,44px)', marginTop: 14, fontWeight: 800 }}>Один консультант.<br />Ноль прямых рисков с заводом.</h2>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['🔥', '4–6 дн.', 'Средний первый ответ'], ['🤝', '92%', 'Запросов с офертой'], ['🚚', '38', 'Стран отгрузки']].map(([ic, n, l]) => (
              <div key={l} className="card" style={{ padding: '16px 18px', minWidth: 132 }}>
                <span style={{ fontSize: 18 }}>{ic}</span>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: 8 }}>{n}</div>
                <div className="section-muted" style={{ fontSize: 12 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {steps.map((s, i) => (
            <div key={s.n} className="card card-hover step-card" style={{ padding: '22px 20px', position: 'relative' }}>
              {i < steps.length - 1 && (
                <span className="step-link" style={{ position: 'absolute', right: -14, top: 38, zIndex: 2, width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--faint)', boxShadow: 'var(--shadow-sm)' }}>→</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 'var(--r-md)', background: `hsl(${s.hue} 70% 94%)`, color: `hsl(${s.hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 22 }}>{s.icon}</div>
                <span style={{ fontSize: 22, fontWeight: 700, color: `hsl(${s.hue} 50% 80%)`, fontFamily: 'var(--font-display)' }}>{s.n}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 7 }}>{s.t}</div>
              <p className="section-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Safety block ---- */
function SafetyBlock() {
  const rows = [
    { icon: '💬', hue: 222, t: 'Стена между вами и заводом', d: 'Консультант ведёт отдельную скрытую линию с заводом. Вам не пишут холодные сообщения, не нужно искать переводчика.' },
    { icon: '👁️', hue: 178, t: 'Вы видите только итоговую цену', d: 'Реальная оптовая цена завода остаётся скрытой. Консультант управляет своей маржой и показывает один понятный оффер.' },
    { icon: '🏆', hue: 28, t: 'Консультанты зарабатывают рейтинг', d: 'Новички проходят испытательный период. Рейтинг ниже 3.0 после 10 отзывов — блокировка до проверки.' },
  ];

  return (
    <section style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)', padding: '88px 0' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div className="eyebrow">Почему это безопасно</div>
          <h2 style={{ fontSize: 'clamp(28px,3.2vw,40px)', marginTop: 12, fontWeight: 800 }}>Риск лежит на консультанте — не на вас.</h2>
          <p className="section-muted" style={{ fontSize: 16, marginTop: 16, lineHeight: 1.6 }}>
            Язык, мошенничество, игры с MOQ, дрейф качества — консультант берёт всё это на себя, на подотчётном канале с рейтингом.
          </p>
          {/* Dual chat peek */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 26 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Вы ↔ Консультант</div>
              <ChatBubble side="in" text="Можем 800 единиц вместо 2000?" />
              <ChatBubble side="out" text="Оставьте мне — я договорюсь с заводом." />
            </div>
            <div className="card" style={{ padding: 14, opacity: .92, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, right: 10, color: 'var(--faint)', fontSize: 13 }}>🔒</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Скрыто · Завод</div>
              <ChatBubble side="in" text="MOQ 800? 我们的最低是 1500。" muted />
              <ChatBubble side="out" text="Разделим оснастку — сойдёмся на 1000." muted />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rows.map((r, i) => (
            <div key={r.t} className="card" style={{ padding: '22px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: `hsl(${r.hue} 70% 94%)`, color: `hsl(${r.hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{r.t}</div>
                <p className="section-muted" style={{ fontSize: 14.5, lineHeight: 1.55 }}>{r.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ side, text, muted }: { side: 'in' | 'out'; text: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: side === 'out' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{
        maxWidth: '88%', fontSize: 12.5, lineHeight: 1.4, padding: '7px 11px', borderRadius: 12,
        background: side === 'out' ? (muted ? 'var(--surface-2)' : 'var(--accent)') : 'var(--surface-2)',
        color: side === 'out' && !muted ? 'var(--accent-ink)' : 'var(--ink-2)',
        border: side === 'in' ? '1px solid var(--line)' : 'none',
        borderBottomRightRadius: side === 'out' ? 3 : 12,
        borderBottomLeftRadius: side === 'in' ? 3 : 12,
      }}>{text}</div>
    </div>
  );
}

/* ---- Categories section ---- */
function CategoriesSection() {
  const { data } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() });
  const categories: Category[] = (data || []).slice(0, 10);

  return (
    <section style={{ padding: '88px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">Каталог</div>
            <h2 style={{ fontSize: 'clamp(28px,3.2vw,40px)', marginTop: 12, fontWeight: 800 }}>Каталог по категориям</h2>
          </div>
          <Link to="/categories" className="btn btn-ghost">Все категории →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {categories.map((c: Category) => {
            const hue = c.hue || 222;
            return (
              <Link
                key={c.id}
                to={`/category/${c.id}`}
                className="card card-hover cat-tile"
                style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start', '--h': hue } as React.CSSProperties}
              >
                <span className="cat-stripe" style={{ background: `linear-gradient(90deg, hsl(${hue} 70% 50%), hsl(${(hue + 30) % 360} 70% 55%))` }} />
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 22 }}>
                  📦
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{c.name}</div>
                  <div className="section-muted" style={{ fontSize: 12.5, marginTop: 3 }}>{c.factoryCount} заводов</div>
                </div>
                <span className="cat-arrow" style={{ marginTop: 'auto' }}>→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---- Featured factories ---- */
function FeaturedFactories() {
  const { data } = useQuery({
    queryKey: ['factories', 'featured'],
    queryFn: () => factoriesApi.list({ limit: 4 }),
  });
  const factories: Factory[] = data?.items || [];

  return (
    <section style={{ padding: '0 0 88px' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">Проверенные поставщики</div>
            <h2 style={{ fontSize: 'clamp(28px,3.2vw,40px)', marginTop: 12, fontWeight: 800 }}>Заводы, достойные первого заказа</h2>
          </div>
          <Link to="/catalog" className="btn btn-ghost">Все заводы →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {factories.length > 0 ? factories.map((f: Factory) => (
            <Link key={f.id} to={`/factory/${f.id}`} className="card card-hover fac-card" style={{ textDecoration: 'none' }}>
              <div style={{ height: 160, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏭</div>
              <div className="fac-card-body">
                <div className="fac-card-name">{f.name}</div>
                <div className="section-muted" style={{ fontSize: 13 }}>{f.province} · {(f.categories || []).map((cc) => cc.category.name).slice(0, 2).join(', ')}</div>
                <div className="fac-card-meta">
                  {f.verified && <span className="badge badge-accent">✓ Верифицирован</span>}
                  {f.leadTime && <span className="badge">{f.leadTime}</span>}
                </div>
              </div>
            </Link>
          )) : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 240 }}>
              <div style={{ height: 160 }} className="shimmer" />
              <div style={{ padding: 18 }}>
                <div className="shimmer" style={{ height: 16, borderRadius: 4, marginBottom: 8 }} />
                <div className="shimmer" style={{ height: 12, borderRadius: 4, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Featured consultants ---- */
function FeaturedConsultants() {
  const { data } = useQuery({
    queryKey: ['consultants', 'featured'],
    queryFn: () => consultantsApi.list({ limit: 4 }),
  });
  const consultants: ConsultantProfile[] = data?.items || [];

  return (
    <section style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)', padding: '88px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">Ваши люди на месте</div>
            <h2 style={{ fontSize: 'clamp(28px,3.2vw,40px)', marginTop: 12, fontWeight: 800 }}>Консультанты с рейтингом по реальным заказам</h2>
          </div>
          <Link to="/consultants" className="btn btn-ghost">Все консультанты →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {consultants.length > 0 ? consultants.map((c: ConsultantProfile) => (
            <Link key={c.id} to={`/consultant/${c.id}`} className="card card-hover cons-card" style={{ textDecoration: 'none' }}>
              <Avatar name={c.user?.name} src={c.user?.avatarUrl} size={52} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.user?.name}</div>
                <div className="section-muted" style={{ fontSize: 13 }}>{(c.categories || []).map((cc) => cc.category.name).slice(0, 2).join(', ')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-ok">⭐ {c.rating.toFixed(1)}</span>
                <span className="badge">{c.dealsClosed} заказов</span>
                {c.verified && <span className="badge badge-accent">✓</span>}
              </div>
              {c.bio && <p className="section-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{c.bio.slice(0, 90)}{c.bio.length > 90 ? '…' : ''}</p>}
            </Link>
          )) : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 22, height: 220 }}>
              <div className="shimmer" style={{ width: 52, height: 52, borderRadius: '50%' }} />
              <div style={{ marginTop: 12 }}>
                <div className="shimmer" style={{ height: 16, borderRadius: 4, marginBottom: 8 }} />
                <div className="shimmer" style={{ height: 12, borderRadius: 4, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- CTA band ---- */
function CTABand() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', position: 'relative', background: 'linear-gradient(120deg, hsl(16 45% 22%), hsl(16 55% 14%))', padding: '64px 56px' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: .3, background: 'radial-gradient(70% 120% at 85% 10%, var(--accent), transparent 60%)' }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.4vw,42px)', fontWeight: 800, lineHeight: 1.05 }}>Ваш первый заказ из Китая — под ключ.</h2>
              <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 17, marginTop: 16, lineHeight: 1.55 }}>Создайте бесплатный аккаунт, оставьте запрос — и проверенный консультант сделает сложную часть.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
              <button className="btn btn-lg" onClick={() => navigate('/register/customer')} style={{ background: '#fff', color: '#1a1a1a' }}>Начать бесплатно →</button>
              <button className="btn btn-lg" onClick={() => navigate('/register/consultant')} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }}>Стать консультантом</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <SafetyBlock />
      <CategoriesSection />
      <FeaturedFactories />
      <FeaturedConsultants />
      <CTABand />
    </div>
  );
}
