import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: number | string;
}

export function Card({ hover, padding, children, className, style, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={clsx('card', hover && 'card-hover', className)}
      style={{ ...(padding !== undefined ? { padding } : {}), ...style }}
    >
      {children}
    </div>
  );
}

interface PanelProps {
  title?: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  pad?: number;
  className?: string;
}

export function Panel({ title, sub, right, children, pad, className }: PanelProps) {
  return (
    <div className={clsx('panel', className)}>
      {(title || right) && (
        <div className="panel-header">
          <div>
            {title && <div className="panel-title">{title}</div>}
            {sub && <div className="section-muted" style={{ fontSize: 13, marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div className="panel-body" style={pad !== undefined ? { padding: pad } : {}}>
        {children}
      </div>
    </div>
  );
}
