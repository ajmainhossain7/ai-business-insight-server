import { UserModel, IUser } from '../models/User.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { RegisterDTO, LoginDTO } from '../types/api.types';
import { logger } from '../utils/logger.utils';

// ============================================================
// Authentication Service
// ============================================================

export interface AuthResult {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(dto: RegisterDTO): Promise<AuthResult> {
  const { name, email, password } = dto;

  // Check for existing user
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw Object.assign(new Error('Email is already registered'), { statusCode: 409 });
  }

  // Create user (password is hashed in the model's pre-save hook)
  const user = await UserModel.create({
    name,
    email,
    password,
    authProvider: 'local',
  });

  logger.info(`New user registered: ${email}`);

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: user.toJSON() as unknown as Omit<IUser, 'password'>,
    accessToken,
    refreshToken,
  };
}

export async function loginUser(dto: LoginDTO): Promise<AuthResult> {
  const { email, password } = dto;

  // Include password for comparison
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (user.authProvider === 'google' && !user.password) {
    throw Object.assign(new Error('This account uses Google Sign-In. Please login with Google.'), { statusCode: 401 });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  logger.info(`User logged in: ${email}`);

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: user.toJSON() as unknown as Omit<IUser, 'password'>,
    accessToken,
    refreshToken,
  };
}

export async function generateTokensForUser(user: IUser): Promise<AuthResult> {
  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: user.toJSON() as unknown as Omit<IUser, 'password'>,
    accessToken,
    refreshToken,
  };
}

// ============================================================
// Demo Login — creates or reuses a shared demo account
// TODO: Restrict in production or add rate limiting
// ============================================================
export async function demoLogin(): Promise<AuthResult> {
  const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@aibusinessinsight.com';
  const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Demo@123456';
  const DEMO_NAME = 'Demo User';

  let user = await UserModel.findOne({ email: DEMO_EMAIL }).select('+password');

  if (!user) {
    // Create the demo user on first use
    user = await UserModel.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      authProvider: 'local',
      role: 'demo',
    });
    logger.info('Demo user created');
  }

  const tokenPayload = { userId: user._id.toString(), email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  user.lastLoginAt = new Date();
  await user.save();

  logger.info('Demo login used');
  return {
    user: user.toJSON() as unknown as Omit<IUser, 'password'>,
    accessToken,
    refreshToken,
  };
}

// ============================================================
// Forgot Password — placeholder for email reset flow
// TODO: Integrate email service (Nodemailer / Resend / SendGrid)
// ============================================================
export async function forgotPassword(email: string): Promise<void> {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  // Always return success to prevent email enumeration attacks
  if (!user) {
    logger.info(`Forgot password: no account found for ${email} (silent)`);
    return;
  }
  // TODO: Generate password reset token, store hash, send email
  logger.info(`Forgot password requested for: ${email} (TODO: send email)`);
}

export const authService = {
  registerUser,
  loginUser,
  generateTokensForUser,
  demoLogin,
  forgotPassword,
};
