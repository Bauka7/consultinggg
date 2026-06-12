import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '../../../api/factories';
import type { Certificate } from '../../../api/types';
import { PageSpinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';

const COMMON_CERTS = ['ISO 9001', 'ISO 14001', 'CE', 'RoHS', 'BSCI', 'SEDEX', 'FDA', 'SGS', 'BRC', 'FSC'];

export function FactoryCertsPage() {
  const { data: factory, isLoading } = useQuery({
    queryKey: ['factory-my'],
    queryFn: () => factoriesApi.myFactory(),
  });

  const certs: Certificate[] = factory?.certs || [];
  const certNames = certs.map((c) => c.name);

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Сертификаты</h1>
      </div>

      {certs.length === 0 ? (
        <EmptyState title="Сертификатов нет" description="Добавьте сертификаты вашего завода" icon="📜" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {certs.map((cert: Certificate) => (
            <div key={cert.id} className="card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center', fontSize: 24 }}>📜</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{cert.name}</div>
              {cert.status === 'active'
                ? <span className="badge badge-ok">✓ Действует{cert.validTill ? ` до ${cert.validTill}` : ''}</span>
                : <span className="badge badge-gold">На проверке</span>}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '22px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Распространённые сертификаты</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COMMON_CERTS.map((cert) => (
            <span key={cert} className={`tag ${certNames.includes(cert) ? 'tag-active' : ''}`} style={{ cursor: 'default' }}>
              {certNames.includes(cert) ? '✓ ' : ''}{cert}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
