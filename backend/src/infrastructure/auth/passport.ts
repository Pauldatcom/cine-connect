import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/** True when Google OAuth env vars are all set; strategy is only registered then. */
export const isGoogleOAuthConfigured = (() => {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callback = process.env.GOOGLE_CALLBACK_URL?.trim();
  return Boolean(id && secret && callback);
})();

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
}

async function generateUniqueUsername(base: string) {
  const root = slugifyUsername(base) || 'user';

  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}${Math.floor(Math.random() * 10000)}`;
    const existing = await db.select().from(users).where(eq(users.username, candidate)).limit(1);
    if (!existing.length) return candidate;
  }

  return `user${Date.now()}`;
}

if (isGoogleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        callbackURL: process.env.GOOGLE_CALLBACK_URL!.trim(),
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const avatarUrl = profile.photos?.[0]?.value ?? null;
          const displayName = profile.displayName || 'user';

          if (!email) {
            return done(new Error('Google account has no email attached'));
          }

          const existingByGoogleId = await db
            .select()
            .from(users)
            .where(eq(users.googleId, googleId))
            .limit(1);

          if (existingByGoogleId.length) {
            return done(null, existingByGoogleId[0]);
          }

          const existingByEmail = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const existingUser = existingByEmail[0];

          if (existingUser) {
            const [updatedUser] = await db
              .update(users)
              .set({
                googleId,
                authProvider: 'google',
                avatarUrl: existingUser.avatarUrl ?? avatarUrl,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser.id))
              .returning();

            return done(null, updatedUser);
          }

          const username = await generateUniqueUsername(displayName);

          const [newUser] = await db
            .insert(users)
            .values({
              email,
              username,
              googleId,
              authProvider: 'google',
              avatarUrl,
              passwordHash: null,
            })
            .returning();

          return done(null, newUser);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
} else if (process.env.NODE_ENV !== 'test') {
  logger.warn(
    'Google OAuth disabled: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in backend .env'
  );
}

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((user: any, done) => done(null, user));
