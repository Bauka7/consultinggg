import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon" style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
          {title}
        </div>
        {description && (
          <p className="section-muted" style={{ fontSize: 14, maxWidth: 320 }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
