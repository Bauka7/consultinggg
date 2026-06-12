import React from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  hue?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name = '', src, size = 36, hue = 222, className }: AvatarProps) {
  const initials = getInitials(name);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar ${className || ''}`}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      className={`avatar ${className || ''}`}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 60% 88%)`,
        color: `hsl(${hue} 55% 38%)`,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
