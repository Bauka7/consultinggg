import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { categoriesApi } from '../../../api/categories';
import { consultantsApi } from '../../../api/consultants';
import { requestsApi } from '../../../api/requests';
import type { Category, ConsultantProfile } from '../../../api/types';
import { Avatar } from '../../../components/ui/Avatar';
import { PageSpinner } from '../../../components/ui/Spinner';

const STEPS = ['Категория', 'Консультант', 'Описание', 'Подтверждение'];

function plural(n: number) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'завод';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'завода';
  return 'заводов';
}

export function NewRequestPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    categoryId: '',
    consultantId: '',
    product: '',
    description: '',
    quantity: '',
    budget: '',
    deadline: '',
  });
  const [error, setError] = useState('');

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories = catData || [];

  const { data: consData, isLoading: consLoading } = useQuery({
    queryKey: ['consultants', { category: form.categoryId }],
    queryFn: () => consultantsApi.list({ categoryId: form.categoryId, limit: 20 }),
    enabled: step >= 1,
  });
  const consultants = consData?.items || [];

  const createMutation = useMutation({
    mutationFn: () => requestsApi.create({
      categoryId: form.categoryId,
      product: form.product,
      requirements: form.description,
      qty: form.quantity,
      budgetHint: form.budget || undefined,
      deadline: form.deadline || undefined,
      consultantId: form.consultantId || undefined,
    }),
    onSuccess: (res) => {
      navigate(`/dashboard/requests/${res.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка создания заявки');
    },
  });

  function canNext() {
    if (step === 0) return !!form.categoryId;
    if (step === 1) return true; // consultant is optional
    if (step === 2) return form.product.trim().length > 2 && form.quantity.trim().length > 0;
    return true;
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else createMutation.mutate();
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Новая заявка</h1>
        <p className="section-muted" style={{ fontSize: 15, marginTop: 8 }}>Заполните заявку и консультант возьмёт её в работу</p>
      </div>

      {/* Wizard steps */}
      <div className="wizard-steps" style={{ marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} className={`wizard-step ${i === step ? 'active' : ''}`}>
            <div className={`wizard-step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <div className="wizard-step-label">{s}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '32px 28px' }}>
        {error && <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 14, marginBottom: 20 }}>{error}</div>}

        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Выберите категорию товара</h2>
            <p className="section-muted" style={{ fontSize: 13.5, marginBottom: 20 }}>Доступны категории, где уже есть проверенные заводы.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {categories.map((c: Category) => {
                const hue = c.hue || 222;
                const available = (c.factoryCount ?? 0) > 0;
                const selected = form.categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!available}
                    onClick={() => available && setForm((f) => ({ ...f, categoryId: c.id }))}
                    className={available ? 'card card-hover' : 'card'}
                    title={available ? '' : 'В этой категории пока нет заводов'}
                    style={{
                      padding: '18px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10,
                      border: selected ? '2px solid var(--accent)' : '1px solid var(--line)',
                      background: selected ? 'var(--accent-soft)' : 'var(--surface)',
                      opacity: available ? 1 : 0.55,
                      cursor: available ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 60% 42%)`, display: 'grid', placeItems: 'center', fontSize: 20 }}>📦</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div className="section-muted" style={{ fontSize: 12 }}>
                      {available ? `${c.factoryCount} ${plural(c.factoryCount ?? 0)}` : 'Нет заводов'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Consultant */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Выберите консультанта</h2>
            <p className="section-muted" style={{ fontSize: 14, marginBottom: 20 }}>Необязательно — система автоматически назначит подходящего</p>
            <button
              onClick={() => setForm((f) => ({ ...f, consultantId: '' }))}
              className={`card card-hover`}
              style={{ width: '100%', padding: '16px 20px', textAlign: 'left', marginBottom: 12, border: !form.consultantId ? '2px solid var(--accent)' : '1px solid var(--line)', background: !form.consultantId ? 'var(--accent-soft)' : 'var(--surface)' }}
            >
              <div style={{ fontWeight: 600, fontSize: 15 }}>🤖 Назначить автоматически</div>
              <div className="section-muted" style={{ fontSize: 13, marginTop: 4 }}>Система выберет наиболее подходящего консультанта</div>
            </button>
            {consLoading ? <PageSpinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                {consultants.map((c: ConsultantProfile) => (
                  <button
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, consultantId: c.id }))}
                    className={`card card-hover`}
                    style={{ padding: '14px 18px', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', border: form.consultantId === c.id ? '2px solid var(--accent)' : '1px solid var(--line)', background: form.consultantId === c.id ? 'var(--accent-soft)' : 'var(--surface)' }}
                  >
                    <Avatar name={c.user.name} src={c.user.avatarUrl} size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.user.name}</div>
                      <div className="section-muted" style={{ fontSize: 13, marginTop: 2 }}>{(c.categories || []).slice(0, 2).map((x) => x.category.name).join(', ')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--warn)', fontWeight: 700 }}>⭐ {c.rating.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: 'var(--faint)' }}>{c.dealsClosed} заказов</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Опишите запрос</h2>
            <div>
              <label className="label">Название товара *</label>
              <input className="input" placeholder="Например: Bluetooth-наушники TWS" value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} />
            </div>
            <div>
              <label className="label">Подробное описание</label>
              <textarea className="input" style={{ minHeight: 100, resize: 'vertical' }} placeholder="Технические характеристики, требования к качеству, упаковке..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label">Количество *</label>
                <input className="input" placeholder="1000 штук" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="label">Бюджет (необязательно)</label>
                <input className="input" placeholder="$5000" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Желаемый срок (необязательно)</label>
              <input type="date" className="input" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Подтверждение заявки</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['📦 Товар', form.product],
                ['🗂️ Категория', categories.find((c: Category) => c.id === form.categoryId)?.name || '—'],
                ['🔢 Количество', form.quantity],
                ['💰 Бюджет', form.budget || 'Не указан'],
                ['📅 Срок', form.deadline || 'Не указан'],
                ['🤝 Консультант', consultants.find((c: ConsultantProfile) => c.id === form.consultantId)?.user.name || 'Авто-назначение'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 14, color: 'var(--faint)', width: 160, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              {form.description && (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ fontSize: 14, color: 'var(--faint)', marginBottom: 6 }}>📝 Описание</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{form.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
          <button
            className="btn btn-ghost"
            onClick={() => step > 0 ? setStep((s) => s - 1) : navigate(-1)}
          >
            ← {step > 0 ? 'Назад' : 'Отмена'}
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={next}
            disabled={!canNext() || createMutation.isPending}
          >
            {step < STEPS.length - 1 ? 'Далее →' : createMutation.isPending ? 'Создание...' : 'Создать заявку ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
