import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

const required = ['DATABASE_URL', 'GOOGLE_API_KEY'] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`WARNING: Missing environment variable ${key}`);
  }
}
