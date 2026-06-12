import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, width = 480, footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: width, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeUp .25s var(--ease) both',
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px', borderBottom: '1px solid var(--line)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 18, color: 'var(--faint)' }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: '22px' }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--line)',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
