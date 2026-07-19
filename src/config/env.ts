import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// Environment Variable Validation
// Validates all required env vars at startup
// ============================================================

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  // TODO: Uncomment when MONGODB_URI is set
  // MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  // TODO: Uncomment when Google OAuth is configured
  // GOOGLE_CLIENT_ID: string;
  // GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  // TODO: Uncomment when Gemini API key is set
  // GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  FRONTEND_URL: string;
  MAX_FILE_SIZE_MB: number;
  UPLOAD_DIR: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    // In production, throw; in development, warn
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    console.warn(`⚠️  Warning: Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

export const env: EnvConfig = {
  PORT: parseInt(getEnvVar('PORT', '5000'), 10),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  JWT_SECRET: getEnvVar('JWT_SECRET', 'dev-secret-change-in-production'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
  GOOGLE_CALLBACK_URL: getEnvVar(
    'GOOGLE_CALLBACK_URL',
    'http://localhost:5000/api/auth/google/callback'
  ),
  GEMINI_MODEL: getEnvVar('GEMINI_MODEL', 'gemini-1.5-pro'),
  FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
  MAX_FILE_SIZE_MB: parseInt(getEnvVar('MAX_FILE_SIZE_MB', '10'), 10),
  UPLOAD_DIR: getEnvVar('UPLOAD_DIR', 'uploads'),
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
