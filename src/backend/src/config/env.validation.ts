// Fail fast on missing/insecure configuration instead of silently falling back.
// Wired into ConfigModule.forRoot({ validate: validateEnv }).

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

const INSECURE_SECRET_MARKERS = [
  'fallback-secret',
  'fallback-refresh-secret',
  'dev-jwt-secret-change-me',
  'dev-refresh-secret-change-me',
  'change-in-production',
  'your-super-secret',
  'your-refresh-secret',
];

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter(
    (key) => !config[key] || String(config[key]).trim() === '',
  );

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Copy .env.example to .env and fill them in.`,
    );
  }

  // In production, refuse to boot with placeholder/insecure JWT secrets.
  if (config.NODE_ENV === 'production') {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      const value = String(config[key] ?? '');
      if (value.length < 16 || INSECURE_SECRET_MARKERS.some((m) => value.includes(m))) {
        throw new Error(
          `${key} is weak or using a placeholder value. Set a strong secret (≥16 chars) for production.`,
        );
      }
    }
  }

  return config;
}
