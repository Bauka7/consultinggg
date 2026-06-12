import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        {...props}
        className={clsx('input', error && 'input-error', className)}
        style={error ? { borderColor: 'var(--accent)', ...props.style } : props.style}
      />
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {label && <label className="label" htmlFor={selectId}>{label}</label>}
      <select
        id={selectId}
        {...props}
        className={clsx('select', className)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <textarea
        id={inputId}
        {...props}
        className={clsx('input', className)}
        style={{ resize: 'vertical', minHeight: 96, ...props.style }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{error}</span>}
    </div>
  );
}
