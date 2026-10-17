import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { findOrCreateOAuthUser, OAuthProfile } from './oauth.service.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required OAuth environment variable: ${name}`);
  return value;
}

// Passport redirects to the provider, exchanges the returned code for a
// profile, then calls the verify callback to find or create our local user.
passport.use('google', new GoogleStrategy(
  {
    clientID: requiredEnv('GOOGLE_CLIENT_ID'),
    clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
    callbackURL: requiredEnv('GOOGLE_CALLBACK_URL'),
    scope: ['profile', 'email'],
  },
  (_accessToken, _refreshToken, profile, done) => {
    findOrCreateOAuthUser('google', profile)
      .then((user) => done(null, user))
      .catch((error: unknown) => done(error as Error));
  },
));

passport.use('github', new GitHubStrategy(
  {
    clientID: requiredEnv('GITHUB_CLIENT_ID'),
    clientSecret: requiredEnv('GITHUB_CLIENT_SECRET'),
    callbackURL: requiredEnv('GITHUB_CALLBACK_URL'),
    scope: ['user:email'],
  },
  (_accessToken: string, _refreshToken: string, profile: OAuthProfile, done: any) => {
    findOrCreateOAuthUser('github', profile)
      .then((user) => done(null, user))
      .catch((error: unknown) => done(error as Error));
  },
));

export { passport };
export default passport;
