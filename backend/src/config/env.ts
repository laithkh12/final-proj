import dotenv from 'dotenv';

// In dev, .env wins over stale machine/user OPENAI_API_KEY placeholders.
dotenv.config({
  override: process.env.NODE_ENV !== 'production',
});

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required when NODE_ENV=production');
}

if (isProduction && !process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required when NODE_ENV=production');
}

const requiredInDev = ['MONGODB_URI', 'JWT_SECRET'] as const;
for (const key of requiredInDev) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not set in environment variables`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || isProduction,
  isProduction,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
};
