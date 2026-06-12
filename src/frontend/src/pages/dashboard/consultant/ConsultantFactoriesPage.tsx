import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultantsApi } from '../../../api/consultants';
import { factoriesApi } from '../../../api/factories';
import type { Factory } from '../../../api/types';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';

export function ConsultantFactoriesPage() {
  const queryClient = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const [factorySearch, setFactorySearch] = useState('');
  const [pitch, setPitch] = useState('');
  const [selected, setSelected] = useState<Factory | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['consultant-my-profile'],
    queryFn: () => consultantsApi.myProfile(),
  });

  const { data: searchData } = useQuery({
    queryKey: ['factories-search', factorySearch],
    queryFn: () => factoriesApi.list({ search: factorySearch, limit: 10 }),
    enabled: factorySearch.length > 2,
  });

  const applyMutation = useMutation({
    mutationFn: ({ factoryId, pitchText }: { factoryId: string; pitchText: string }) =>
      consultantsApi.applyToFactory(factoryId, pitchText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-my-profile'] });
      setShowApply(false);
      setSelected(null);
      setPitch('');
      setFactorySearch('');
    },
  });

  const factories: Factory[] = (profile?.factories || []).map((f) => f.factory as unknown as Factory);
  const searchResults: Factory[] = searchData?.items || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Мои заводы</h1>
        <button className="btn btn-primary" onClick={() => setShowApply(true)}>＋ Подать заявку на завод</button>
      </div>

      {isLoading ? <PageSpinner /> : factories.length === 0 ? (
        <EmptyState
          title="Заводы не привязаны"
          description="Подайте заявку на завод — после одобрения администратором завода вы сможете создавать офферы"
          icon="🏭"
          action={<button className="btn btn-primary btn-sm" onClick={() => setShowApply(true)}>Подать заявку</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {factories.map((f: Factory) => (
            <div key={f.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>🏭</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</div>
                  <div className="section-muted" style={{ fontSize: 13 }}>{f.city || f.province || ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {f.verified && <span className="badge badge-ok">✓ Верифицирован</span>}
              </div>
              <Link to={`/factory/${f.id}`} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Профиль завода</Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Подать заявку на завод">
        <div>
          {!selected ? (
            <>
              <label className="label">Поиск завода</label>
              <input className="input" placeholder="Название завода..." value={factorySearch} onChange={(e) => setFactorySearch(e.target.value)} />
              {factorySearch.length > 2 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {searchResults.map((f: Factory) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                        <div className="section-muted" style={{ fontSize: 12 }}>{f.city || f.province || ''}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelected(f)}>Выбрать</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</div>
                <div className="section-muted" style={{ fontSize: 13 }}>{selected.city || selected.province || ''}</div>
              </div>
              <label className="label">Сопроводительное сообщение</label>
              <textarea className="input" rows={4} placeholder="Расскажите, почему вы подходите этому заводу..." value={pitch} onChange={(e) => setPitch(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← Назад</button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => applyMutation.mutate({ factoryId: selected.id, pitchText: pitch })}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? 'Отправка...' : 'Отправить заявку'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
