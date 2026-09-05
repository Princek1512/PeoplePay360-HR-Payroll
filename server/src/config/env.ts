import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/peoplepay360?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_access_token_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'peoplepay360_super_secret_jwt_refresh_token_key_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
