import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'pwoa_secure_jwt_token_secret_production_2026');
const databaseUrl = process.env.DATABASE_URL || '';
const seedSetting = process.env.SEED_DEMO_DATA?.trim().toLowerCase();

export const config = {
  port: parseInt(process.env.APP_PORT || process.env.PORT || '3000', 10),
  nodeEnv,
  jwtSecret,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-3.8-flash',
  databasePath: process.env.DATABASE_PATH || './data/pwoa_postgres',
  databaseUrl,
  seedDemoData: seedSetting ? seedSetting === 'true' : nodeEnv !== 'production',
};

export function validateRuntimeConfig(): void {
  if (config.nodeEnv !== 'production') {
    return;
  }

  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is required in production.');
  }

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required in production.');
  }
}
