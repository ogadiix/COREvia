/**
 * COREvia Centralized Environment Configuration & Validation
 * Enforces production invariants, safe secret handling, and deterministic AI fallbacks.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  configSummary: {
    nodeEnv: string;
    port: number;
    appUrl: string;
    databaseConfigured: boolean;
    geminiConfigured: boolean;
    geminiModel: string;
    corsAllowedOriginsCount: number;
  };
}

export function validateEnvironment(): EnvValidationResult {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  if (isNaN(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid integer between 1 and 65535.');
  }

  // APP_URL validation
  const appUrl = process.env.APP_URL || (isProd ? '' : `http://localhost:${port}`);
  if (isProd && !process.env.APP_URL) {
    errors.push('APP_URL is required in production (e.g. https://corevia.bank.internal).');
  }

  // SESSION_SECRET validation
  if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.trim().length < 32)) {
    errors.push('SESSION_SECRET is required in production and must be at least 32 characters.');
  }

  // Database configuration validation
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
  const hasSqlConfig = Boolean(process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME);
  const isDbConfigured = hasDatabaseUrl || hasSqlConfig;

  if (isProd && !isDbConfigured) {
    errors.push('DATABASE_URL or SQL credentials (SQL_HOST, SQL_USER, SQL_DB_NAME) must be configured in production.');
  }

  // CORS validation
  const corsOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
  const corsParts = corsOrigins.split(',').map((s) => s.trim()).filter(Boolean);
  if (isProd && corsParts.length === 0) {
    errors.push('CORS_ALLOWED_ORIGINS is required in production (comma-separated list of approved origins).');
  }

  // Gemini configuration
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!hasGeminiKey) {
    console.info('ℹ️  GEMINI: NOT CONFIGURED — deterministic fallback enabled');
  } else {
    console.info(`✓ GEMINI: CONFIGURED (Model: ${geminiModel}) — server-side proxy active`);
  }

  const valid = errors.length === 0;

  if (!valid && isProd) {
    console.error('CRITICAL ERROR: Production environment configuration validation failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
  }

  return {
    valid,
    errors,
    warnings,
    configSummary: {
      nodeEnv,
      port,
      appUrl,
      databaseConfigured: isDbConfigured,
      geminiConfigured: hasGeminiKey,
      geminiModel,
      corsAllowedOriginsCount: corsParts.length,
    },
  };
}
