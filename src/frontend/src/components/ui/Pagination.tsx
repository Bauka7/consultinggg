import React from 'react';
import clsx from 'clsx';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        style={{ opacity: page <= 1 ? 0.4 : 1 }}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`el-${i}`} style={{ padding: '0 4px', color: 'var(--faint)', fontSize: 14 }}>…</span>
        ) : (
          <button
            key={p}
            className={clsx('page-btn', p === page && 'active')}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        className="page-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        style={{ opacity: page >= totalPages ? 0.4 : 1 }}
      >
        ›
      </button>
    </div>
  );
}
