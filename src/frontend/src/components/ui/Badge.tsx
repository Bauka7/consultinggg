import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant?: 'default' | 'accent' | 'ok' | 'gold' | 'warn';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge',
        variant === 'accent' && 'badge-accent',
        variant === 'ok' && 'badge-ok',
        variant === 'gold' && 'badge-gold',
        variant === 'warn' && 'badge-gold',
        className
      )}
    >
      {children}
    </span>
  );
}

// Statuses match the backend Prisma enums exactly.
const STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  // requests: draft|work|wait|done|declined
  draft: { label: 'Черновик', variant: 'default' },
  work: { label: 'В работе', variant: 'gold' },
  wait: { label: 'Ожидает', variant: 'gold' },
  done: { label: 'Завершён', variant: 'ok' },
  declined: { label: 'Отменена', variant: 'default' },
  // orders: draft|pending|confirmed|production|qc|shipped|transit|delivered|closed|cancelled
  pending: { label: 'Ожидает', variant: 'gold' },
  confirmed: { label: 'Подтверждён', variant: 'accent' },
  production: { label: 'Производство', variant: 'gold' },
  qc: { label: 'Контроль кач.', variant: 'gold' },
  shipped: { label: 'Отгружен', variant: 'accent' },
  transit: { label: 'В пути', variant: 'accent' },
  delivered: { label: 'Доставлен', variant: 'ok' },
  closed: { label: 'Закрыт', variant: 'ok' },
  cancelled: { label: 'Отменён', variant: 'default' },
  // offers: pending|accepted|revision|expired
  accepted: { label: 'Принят', variant: 'ok' },
  revision: { label: 'На пересмотре', variant: 'warn' },
  expired: { label: 'Истёк', variant: 'default' },
  // application/user/invite extra
  review: { label: 'На рассмотрении', variant: 'gold' },
  trial: { label: 'Испытательный', variant: 'accent' },
  approved: { label: 'Одобрен', variant: 'ok' },
  rejected: { label: 'Отклонён', variant: 'default' },
  active: { label: 'Активен', variant: 'ok' },
  blocked: { label: 'Заблокирован', variant: 'default' },
  pass: { label: 'Пройдена', variant: 'ok' },
  flag: { label: 'Внимание', variant: 'warn' },
  fail: { label: 'Провалена', variant: 'default' },
  used: { label: 'Использовано', variant: 'default' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || { label: status, variant: 'default' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
