import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { factoriesApi } from '../../../api/factories';
import { PageSpinner } from '../../../components/ui/Spinner';

const PROVINCES = ['Гуандун', 'Чжэцзян', 'Цзянсу', 'Шанхай', 'Шаньдун', 'Хэбэй', 'Фуцзянь'];

export function FactoryProfilePage() {
  const queryClient = useQueryClient();
  const { data: factory, isLoading } = useQuery({
    queryKey: ['factory-my'],
    queryFn: () => factoriesApi.myFactory(),
  });

  const [form, setForm] = useState({
    name: '', about: '', province: '', city: '',
    staff: '', leadTime: '', area: '', established: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (factory) {
      setForm({
        name: factory.name || '',
        about: factory.about || '',
        province: factory.province || '',
        city: factory.city || '',
        staff: factory.staff || '',
        leadTime: factory.leadTime || '',
        area: factory.area || '',
        established: factory.established?.toString() || '',
      });
    }
  }, [factory]);

  const updateMutation = useMutation({
    mutationFn: () => factoriesApi.updateMyFactory({
      name: form.name,
      about: form.about,
      province: form.province,
      city: form.city,
      staff: form.staff,
      leadTime: form.leadTime,
      area: form.area,
      established: form.established ? parseInt(form.established) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factory-my'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <PageSpinner />;

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 24 }}>Профиль завода</h1>

      <div className="card" style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label className="label">Название завода</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Описание</label>
          <textarea className="input" style={{ minHeight: 120, resize: 'vertical' }} value={form.about} onChange={(e) => set('about', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="label">Провинция</label>
            <select className="select" value={form.province} onChange={(e) => set('province', e.target.value)}>
              <option value="">Выберите</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Город</label>
            <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="label">Год основания</label>
            <input className="input" type="number" value={form.established} onChange={(e) => set('established', e.target.value)} />
          </div>
          <div>
            <label className="label">Количество сотрудников</label>
            <input className="input" placeholder="100-500" value={form.staff} onChange={(e) => set('staff', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="label">Срок производства</label>
            <input className="input" placeholder="15–30 дней" value={form.leadTime} onChange={(e) => set('leadTime', e.target.value)} />
          </div>
          <div>
            <label className="label">Площадь</label>
            <input className="input" placeholder="18 000 м²" value={form.area} onChange={(e) => set('area', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
          <button className="btn btn-primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          {saved && <span style={{ color: 'var(--ok)', fontSize: 14 }}>✓ Сохранено</span>}
        </div>
      </div>
    </div>
  );
}
