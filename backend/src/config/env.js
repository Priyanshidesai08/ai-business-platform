import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 25000),
  aiRetryCount: Number(process.env.AI_RETRY_COUNT || 2),
  aiCacheTtlMs: Number(process.env.AI_CACHE_TTL_MS || 10 * 60 * 1000)
};
