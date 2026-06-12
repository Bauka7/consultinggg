import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import type { SourcingRequest } from '../../../api/types';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../components/ui/Badge';
import { Panel } from '../../../components/ui/Card';

const STEPS = [
  { icon: '📝', title: 'Опишите заявку', text: 'Категория, товар, количество и требования — за пару минут.' },
  { icon: '💼', title: 'Получите предложение', text: 'Консультант согласует цену с заводом и пришлёт одно понятное предложение.' },
  { icon: '📦', title: 'Отслеживайте заказ', text: 'Производство, контроль качества и доставка — всё под контролем.' },
];

export function ClientOverviewPage() {
  const { user } = useAuth();

  const { data: reqData } = useQuery({
    queryKey: ['requests', { limit: 5 }],
    queryFn: () => requestsApi.list({ limit: 5 }),
  });

  const requests = reqData?.items || [];
  const active = requests.filter((r: SourcingRequest) => r.status === 'work' || r.status === 'wait');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── HERO: главный акцент на создание заявки ───────────────────────── */}
      <div
        className="card"
        style={{
          padding: '40px 40px',
          background: 'linear-gradient(150deg, var(--ink), color-mix(in srgb, var(--ink) 72%, var(--accent)))',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -40, bottom: -50, opacity: 0.1, fontSize: 220, lineHeight: 1 }}>🛒</div>
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.7 }}>
            Закупки из Китая — без рисков
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, marginTop: 12, lineHeight: 1.1 }}>
            {user?.name ? `${user.name.split(' ')[0]}, что хотите заказать?` : 'Что хотите заказать?'}
          </h1>
          <p style={{ fontSize: 16, marginTop: 14, opacity: 0.85, lineHeight: 1.55 }}>
            Опишите товар — проверенный консультант подберёт завод, согласует цену и проведёт сделку под ключ.
            Вы получаете одно понятное предложение «всё включено».
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <Link
              to="/dashboard/requests/new"
              className="btn btn-lg"
              style={{ background: '#fff', color: 'var(--ink)', fontWeight: 700, fontSize: 16, padding: '14px 28px' }}
            >
              ＋ Создать заявку
            </Link>
            {active.length > 0 && (
              <Link
                to="/dashboard/requests"
                className="btn btn-lg"
                style={{ background: 'rgba(255,255,255,.14)', color: '#fff', fontWeight: 600 }}
              >
                Мои заявки ({active.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Как это работает ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STEPS.map((s, i) => (
          <div key={s.title} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--faint)', fontWeight: 600 }}>0{i + 1}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 4 }}>{s.title}</div>
            <div className="section-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s.text}</div>
          </div>
        ))}
      </div>

      {/* ── Активные заявки — только если есть ────────────────────────────── */}
      {active.length > 0 && (
        <Panel
          title="Ваши активные заявки"
          right={<Link to="/dashboard/requests" className="btn btn-ghost btn-sm">Все заявки →</Link>}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 1fr 120px 110px', gap: 16, padding: '8px 0', fontSize: 12, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--line)' }}>
              <span>Товар</span><span>Консультант</span><span>Статус</span><span>Срок</span>
            </div>
            {active.map((r: SourcingRequest) => (
              <Link
                key={r.id}
                to={`/dashboard/requests/${r.id}`}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 1fr 120px 110px', gap: 16, padding: '12px 0', alignItems: 'center', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit' }}
              >
                <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.consultant?.user?.name || '—'}</span>
                <StatusBadge status={r.status} />
                <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{r.deadline ? r.deadline.slice(0, 10) : '—'}</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
