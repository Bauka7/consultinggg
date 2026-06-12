import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '../../../api/factories';
import type { Product } from '../../../api/types';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PageSpinner } from '../../../components/ui/Spinner';

export function FactoryProductsPage() {
  const { data: factory, isLoading } = useQuery({
    queryKey: ['factory-my'],
    queryFn: () => factoriesApi.myFactory(),
  });

  const products: Product[] = factory?.products || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>Продукты</h1>
        <button className="btn btn-primary">＋ Добавить продукт</button>
      </div>

      {isLoading ? <PageSpinner /> : products.length === 0 ? (
        <EmptyState title="Продуктов нет" description="Добавьте продукты вашего завода для лучшей видимости" icon="📦" action={<button className="btn btn-primary btn-sm">Добавить первый продукт</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {products.map((p: Product) => (
            <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 140, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                {p.sku && <p className="section-muted" style={{ fontSize: 13, marginTop: 4 }}>{p.sku}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {p.moq != null && <span className="badge">MOQ: {p.moq}</span>}
                  {p.priceLo != null && p.priceHi != null && <span className="badge badge-ok">${p.priceLo}–{p.priceHi}</span>}
                  {!p.active && <span className="badge">Скрыт</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
