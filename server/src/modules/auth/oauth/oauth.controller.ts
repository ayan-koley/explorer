import type { NextFunction, Request, Response } from 'express';
import passport from './passport.js';
import { generateHash } from '../../../utils/hash.js';
import { generateAccessToken, generateRefreshToken } from '../../../utils/token.js';
import { db } from '../../../prisma/db.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

// These handlers begin the provider redirect. `session: false` keeps Passport
// stateless because this app issues its own JWT cookies after OAuth completes.
export const startGoogleOAuth = passport.authenticate('google', { session: false });
export const startGitHubOAuth = passport.authenticate('github', { session: false });

async function finishOAuth(provider: 'google' | 'github', req: Request, res: Response, next: NextFunction) {
  passport.authenticate(provider, { session: false }, async (error: unknown, oauthUser: unknown) => {
    try {
      if (error || !oauthUser) {
        return res.status(401).json(ApiResponse.error('OAuth sign-in failed'));
      }

      const user = oauthUser as { id: number; full_name: string; username: string; email?: string };
      const accessToken = generateAccessToken({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
      });
      const { refreshToken, jti } = generateRefreshToken({ id: user.id });
      const hashRefreshToken = await generateHash(refreshToken);

      await db.orm.public.RefreshToken.create({
        user_id: user.id,
        token_id: jti,
        hash_refresh_token: hashRefreshToken,
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Match the cookie contract used by password sign-in.
      return res
        .cookie('accessToken', accessToken, { maxAge: 7 * 60 * 60 * 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
        .cookie('refreshToken', refreshToken, { maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
        .status(200)
        .json(ApiResponse.success({ id: user.id, full_name: user.full_name, username: user.username, email: user.email }, `${provider} sign-in successful`));
    } catch (callbackError) {
      next(callbackError);
    }
  })(req, res, next);
}

// On callback, Passport validates the provider response and calls the strategy
// verify function; finishOAuth then issues this app's access and refresh cookies.
export const googleOAuthCallback = (req: Request, res: Response, next: NextFunction) =>
  finishOAuth('google', req, res, next);

export const githubOAuthCallback = (req: Request, res: Response, next: NextFunction) =>
  finishOAuth('github', req, res, next);
