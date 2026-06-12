import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, PlatformSettings } from '../../../api/admin';
import { PageSpinner } from '../../../components/ui/Spinner';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle" style={{ position: 'relative', display: 'inline-flex', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <div className="toggle-track" style={{ position: 'absolute', inset: 0, borderRadius: 999, background: checked ? 'var(--accent)' : 'var(--line-2)', transition: 'background .2s' }} />
      <div className="toggle-thumb" style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s' }} />
    </label>
  );
}

function SliderField({ label, desc, value, min, max, step = 1, onChange, suffix = '' }: {
  label: string; desc?: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
          {desc && <p className="section-muted" style={{ fontSize: 13, marginTop: 2 }}>{desc}</p>}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--accent)', minWidth: 60, textAlign: 'right' }}>{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', height: 4 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--faint)' }}>
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function ToggleField({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
        {desc && <p className="section-muted" style={{ fontSize: 13, marginTop: 2, maxWidth: 480 }}>{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const [settings, setSettings] = useState<PlatformSettings>({
    id: 1,
    trialOrders: 3,
    warnThreshold: 3.5,
    blockThreshold: 3.0,
    autoApprove: false,
    autoAssign: true,
    assignRule: 'load',
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function set<K extends keyof PlatformSettings>(key: K, val: PlatformSettings[K]) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Настройки платформы</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ color: 'var(--ok)', fontSize: 14 }}>✓ Сохранено</span>}
          <button className="btn btn-primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Consultants */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Консультанты</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          <SliderField
            label="Испытательных заказов"
            desc="Количество заказов до получения полного статуса консультанта"
            value={settings.trialOrders}
            min={1} max={10}
            onChange={(v) => set('trialOrders', v)}
          />
          <SliderField
            label="Порог предупреждения"
            desc="Рейтинг ниже этого значения после 10 отзывов выдаёт предупреждение"
            value={settings.warnThreshold}
            min={1.0} max={5.0} step={0.1}
            onChange={(v) => set('warnThreshold', v)}
            suffix=" ★"
          />
          <SliderField
            label="Порог блокировки"
            desc="Рейтинг ниже этого значения после 10 отзывов ведёт к блокировке"
            value={settings.blockThreshold}
            min={1.0} max={5.0} step={0.1}
            onChange={(v) => set('blockThreshold', v)}
            suffix=" ★"
          />
        </div>

        <ToggleField
          label="Автоодобрение консультантов"
          desc="Заявки консультантов одобряются автоматически без ручной проверки"
          checked={settings.autoApprove}
          onChange={(v) => set('autoApprove', v)}
        />
        <ToggleField
          label="Автоназначение консультантов"
          desc="Система автоматически назначает подходящего консультанта на запрос клиента"
          checked={settings.autoAssign}
          onChange={(v) => set('autoAssign', v)}
        />
      </div>
    </div>
  );
}
