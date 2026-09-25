export function validateEnvironment() {
  const isProd = process.env.NODE_ENV === 'production';
  const requiredVars = [
    'SESSION_SECRET',
    'GEMINI_API_KEY',
    'DATABASE_URL'
  ];

  const missing = [];
  
  if (!process.env.SESSION_SECRET && isProd) {
    missing.push('SESSION_SECRET');
  }

  // Allow Cloud SQL credentials instead of DATABASE_URL if in GCP
  const hasDbConfig = process.env.DATABASE_URL || (process.env.SQL_HOST && process.env.SQL_USER);
  if (!hasDbConfig && isProd) {
    missing.push('DATABASE_URL or SQL credentials');
  }
  
  if (!process.env.GEMINI_API_KEY) {
     console.warn('WARNING: GEMINI_API_KEY is not set. AI Copilot will not function.');
  }

  if (isProd && missing.length > 0) {
    console.error(`CRITICAL ERROR: Missing required environment variables for production:`);
    missing.forEach(v => console.error(`- ${v}`));
    console.error('Server cannot start securely. Exiting.');
    process.exit(1);
  }
}
