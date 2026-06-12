import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../../../api/requests';
import { offersApi } from '../../../api/offers';
import { consultantsApi } from '../../../api/consultants';
import { StatusBadge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { PageSpinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../hooks/useAuth';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isClient, isConsultant } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showOffer, setShowOffer] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.get(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => requestsApi.decline(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      navigate('/dashboard/requests', { replace: true });
    },
    onError: (e: any) => alert(e.response?.data?.message || 'Не удалось отменить заявку'),
  });

  function handleCancel() {
    if (window.confirm('Отменить заявку? Это действие необратимо.')) cancelMutation.mutate();
  }

  const request = data;

  if (isLoading) return <PageSpinner />;
  if (!request) return <div>Заявка не найдена</div>;

  // Consultant can make an offer while the request is active and not yet closed
  const canOffer = isConsultant && ['draft', 'work', 'wait'].includes(request.status);

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--muted)' }}>
        <Link to="/dashboard/requests">Заявки</Link>
        <span>›</span>
        <span style={{ color: 'var(--ink)' }}>{request.product}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>{request.product}</h1>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={request.status} />
            {request.category && <span className="badge">{request.category.name}</span>}
            <span className="section-muted" style={{ fontSize: 13 }}>Создан: {new Date(request.createdAt).toLocaleDateString('ru')}</span>
          </div>
        </div>
        {isClient && ['draft', 'work', 'wait'].includes(request.status) && (
          <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={cancelMutation.isPending} style={{ color: 'var(--accent)' }}>
            {cancelMutation.isPending ? 'Отмена…' : 'Отменить заявку'}
          </button>
        )}
        {canOffer && (
          <button className="btn btn-primary btn-lg" onClick={() => setShowOffer(true)}>＋ Создать оффер</button>
        )}
      </div>

      {/* Client status banners */}
      {isClient && (request.status === 'work' || request.status === 'draft') && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-2)' }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>✓</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>Заявка передана консультанту</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {request.consultant?.user?.name || 'Консультант'} изучит ваш запрос и пришлёт предложение — обычно в течение нескольких часов. Когда оно появится, вы увидите его в разделе «Офферы».
            </div>
          </div>
        </div>
      )}
      {isClient && request.status === 'wait' && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--warn-soft)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>💼</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>Консультант прислал предложение</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>Откройте оффер, чтобы принять его или запросить пересмотр.</div>
            </div>
          </div>
          <Link to="/dashboard/offers" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Смотреть офферы →</Link>
        </div>
      )}
      {isClient && request.status === 'done' && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--ok-soft)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>📦</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>По заявке оформлен заказ</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>Отслеживайте производство и доставку в разделе «Заказы».</div>
            </div>
          </div>
          <Link to="/dashboard/orders" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Мои заказы →</Link>
        </div>
      )}

      {/* Consultant guidance banner */}
      {isConsultant && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-2)' }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>🧭</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>
              {request.status === 'wait' ? 'Вы отправили предложение' : 'Что делать дальше'}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {request.status === 'wait'
                ? 'Клиент рассматривает ваш оффер. Можно отредактировать его в разделе «Офферы» или уточнить детали в чате.'
                : 'Согласуйте цену с заводом на скрытой линии в «Сообщениях», затем нажмите «Создать оффер» — клиент увидит только итоговую цену.'}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Детали заявки</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Товар', request.product],
                ['Количество', request.qty],
                ['Бюджет', request.budgetHint || 'Не указан'],
                ['Срок', request.deadline ? new Date(request.deadline).toLocaleDateString('ru') : 'Не указан'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 14, color: 'var(--faint)', width: 120, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              {request.requirements && (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontSize: 14, color: 'var(--faint)', marginBottom: 6 }}>Требования</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{request.requirements}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — role-aware */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Consultant sees the CLIENT + actions */}
          {isConsultant && (
            <>
              {request.client && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 14 }}>КЛИЕНТ</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={request.client.name} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{request.client.name}</div>
                      <div className="section-muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(request.client as any).email || ''}</div>
                    </div>
                  </div>
                  <Link to="/dashboard/messages" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 14, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    💬 Чат с клиентом
                  </Link>
                </div>
              )}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 8 }}>ДЕЙСТВИЯ</div>
                {canOffer ? (
                  <button className="btn btn-primary btn-block" onClick={() => setShowOffer(true)}>＋ Создать оффер</button>
                ) : (
                  <div className="section-muted" style={{ fontSize: 13 }}>По этой заявке оффер уже не требуется.</div>
                )}
                <Link to="/dashboard/messages" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                  🔒 Линия с заводом
                </Link>
                <p className="section-muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.45 }}>
                  Цену с заводом согласуйте в скрытом чате — клиент его не видит.
                </p>
              </div>
            </>
          )}

          {/* Client sees the CONSULTANT */}
          {!isConsultant && request.consultant && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--faint)', marginBottom: 14 }}>КОНСУЛЬТАНТ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={request.consultant.user?.name} src={request.consultant.user?.avatarUrl} size={44} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{request.consultant.user?.name}</div>
                  <Link to={`/consultant/${request.consultant.id}`} style={{ fontSize: 13, color: 'var(--accent)' }}>Профиль →</Link>
                </div>
              </div>
              <Link to="/dashboard/messages" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 14, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                💬 Написать
              </Link>
            </div>
          )}
        </div>
      </div>

      {showOffer && <CreateOfferModal request={request} onClose={() => setShowOffer(false)} />}
    </div>
  );
}

// ── Offer creation modal (consultant) ──────────────────────────────────────
function CreateOfferModal({ request, onClose }: { request: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const qtyNum = parseInt(String(request.qty || '').replace(/\D/g, '')) || 0;

  // Factories this consultant is linked to — which one will fulfill the order
  const { data: profile } = useQuery({
    queryKey: ['consultant-my-profile'],
    queryFn: () => consultantsApi.myProfile(),
  });
  const linkedFactories = (profile?.factories || []).map((f) => f.factory);

  const [factoryId, setFactoryId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [qty, setQty] = useState(request.qty || '');
  const [leadTime, setLeadTime] = useState('');
  const [incoterm, setIncoterm] = useState('FOB');
  const [note, setNote] = useState('');
  const [validTill, setValidTill] = useState('');
  const [error, setError] = useState('');

  // Default to the first linked factory once profile loads
  React.useEffect(() => {
    if (!factoryId && linkedFactories.length > 0) setFactoryId(linkedFactories[0].id);
  }, [linkedFactories.length]);

  const price = parseFloat(unitPrice) || 0;
  const total = price * (qtyNum || 0);

  const createMutation = useMutation({
    mutationFn: () =>
      offersApi.create({
        requestId: request.id,
        factoryId: factoryId || undefined,
        product: request.product,
        qty,
        unitPrice: price,
        total: total > 0 ? total : price,
        leadTime: leadTime || undefined,
        incoterm: incoterm || undefined,
        note: note || undefined,
        validTill: validTill || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', request.id] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      onClose();
      navigate('/dashboard/offers');
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Не удалось создать оффер'),
  });

  return (
    <Modal open onClose={onClose} title={`Оффер по заявке: ${request.product}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14 }}>{error}</div>}

        <div>
          <label className="label">Завод-исполнитель</label>
          {linkedFactories.length > 0 ? (
            <select className="select" value={factoryId} onChange={(e) => setFactoryId(e.target.value)}>
              {linkedFactories.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          ) : (
            <div className="section-muted" style={{ fontSize: 13, padding: '8px 0' }}>
              Вы не привязаны ни к одному заводу. Оффер можно отправить, но заказ не попадёт заводу автоматически.
              Привязка — в разделе «Заводы».
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Цена за единицу, $ *</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          <div>
            <label className="label">Количество</label>
            <input className="input" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-muted" style={{ fontSize: 13 }}>Итоговая сумма (видит клиент)</span>
          <span className="mono" style={{ fontWeight: 800, fontSize: 18 }}>${total.toLocaleString('ru-RU', { minimumFractionDigits: total % 1 ? 2 : 0 })}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Срок производства</label>
            <input className="input" placeholder="напр. 35 дней" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} />
          </div>
          <div>
            <label className="label">Условия (инкотермс)</label>
            <select className="select" value={incoterm} onChange={(e) => setIncoterm(e.target.value)}>
              <option>FOB</option><option>CIF</option><option>EXW</option><option>DDP</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Действует до</label>
          <input className="input" type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} />
        </div>

        <div>
          <label className="label">Заметка для клиента</label>
          <textarea className="input" style={{ minHeight: 70, resize: 'vertical' }} placeholder="Что входит в цену, условия, важные детали…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!price || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Отправка…' : 'Отправить оффер клиенту'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
