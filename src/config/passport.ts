import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import { UserModel } from '../models/User.model';
import { logger } from '../utils/logger.utils';

// ============================================================
// Google OAuth 2.0 Configuration
// ============================================================
// TODO: Set these in your .env file:
//   GOOGLE_CLIENT_ID     → From Google Cloud Console → APIs & Services → Credentials
//   GOOGLE_CLIENT_SECRET → From Google Cloud Console → APIs & Services → Credentials
//   GOOGLE_CALLBACK_URL  → Must match exactly in Google Console (Authorized redirect URIs)
//
// Setup steps:
//   1. Go to https://console.cloud.google.com/
//   2. Create a new project or select existing
//   3. Enable "Google+ API" or "Google Identity Services"
//   4. Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID
//   5. Set Authorized redirect URI to: http://localhost:5000/api/auth/google/callback
//   6. Copy Client ID and Client Secret to .env
// ============================================================

export function configurePassport(): void {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientID || !clientSecret) {
    logger.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Find or create user
          let user = await UserModel.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            // Update Google ID if signing in with email that already exists
            if (!user.googleId) {
              user.googleId = profile.id;
              user.avatar = avatar;
              await user.save();
            }
          } else {
            // Create new user from Google profile
            user = await UserModel.create({
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatar,
              isEmailVerified: true, // Google emails are verified
              authProvider: 'google',
            });
          }

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { id: string }).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserModel.findById(id).select('-password');
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  logger.info('✅ Google OAuth configured');
}
