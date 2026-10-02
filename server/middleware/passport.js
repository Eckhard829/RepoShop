const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const {
  JWT_SECRET, COOKIE_NAME,
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  OAUTH_CALLBACK_BASE,
} = require('../config/env');
const { userById, createUser } = require('../models/user');
const { findByProvider, linkAccount } = require('../models/oauth');

// ---- JWT strategy: reads the same `t` cookie our login sets ----
// This is now THE auth guard — every protected route uses passport.authenticate('jwt').
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.[COOKIE_NAME] || null,
      ]),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const u = (await userById(payload.id)).rows[0];
        if (!u) return done(null, false);
        // Attach impersonation id (set by admin impersonate endpoint) alongside the user.
        return done(null, { ...u, imp: payload.imp || null });
      } catch (e) {
        return done(e, false);
      }
    }
  )
);

// ---- Google OAuth strategy ----
// Registers only if credentials are present so the server boots without them.
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${OAUTH_CALLBACK_BASE}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const providerUserId = profile.id;             // Google's stable `sub`
          const email = profile.emails?.[0]?.value || null;
          const avatarUrl = profile.photos?.[0]?.value || null;
          const displayName = profile.displayName || null;

          // 1. Already linked? Use that user.
          const existing = (await findByProvider('google', providerUserId)).rows[0];
          if (existing) {
            const u = (await userById(existing.user_id)).rows[0];
            return done(null, u);
          }

          // 2. New OAuth identity → create a fresh user, then link.
          //    We do NOT auto-link by email — safer, avoids account takeover
          //    if the provider's email isn't verified.
          const created = await createUser(email ? email.toLowerCase() : null, null);
          await linkAccount(created.id, 'google', providerUserId, email, displayName, avatarUrl);
          const u = (await userById(created.id)).rows[0];
          done(null, u);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

module.exports = { passport };