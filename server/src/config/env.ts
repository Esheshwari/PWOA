import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.APP_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'pwoa_secure_jwt_token_secret_production_2026',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-3.8-flash',
  databasePath: process.env.DATABASE_PATH || './data/pwoa_postgres',
};
