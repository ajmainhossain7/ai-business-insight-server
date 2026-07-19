import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokenPayload } from '../types/api.types';

// ============================================================
// JWT Utilities
// ============================================================

export function generateAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET + '_refresh', {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET + '_refresh') as AuthTokenPayload;
}

export function decodeToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.decode(token) as AuthTokenPayload;
  } catch {
    return null;
  }
}
