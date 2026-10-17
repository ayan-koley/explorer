import type { Profile as GoogleProfile } from 'passport-google-oauth20';
import type { Profile as GitHubProfile } from 'passport-github2';
import { db } from '../../../prisma/db.js';

export type OAuthProvider = 'google' | 'github';
export type OAuthProfile = GoogleProfile | GitHubProfile;

/**
 * Convert a provider profile to a local user. Provider IDs are the durable
 * identity key; email is used only to connect a new provider to an existing
 * account and avoid duplicate accounts.
 */
export async function findOrCreateOAuthUser(provider: OAuthProvider, profile: OAuthProfile) {
  const providerUserId = profile.id;
  const email = profile.emails?.[0]?.value?.toLowerCase();
  const displayName = profile.displayName?.trim() || profile.username || `${provider} user`;

  if (!email) throw new Error(`${provider} did not provide an email address`);

  const linkedIdentity = await db.orm.public.User_Auth_Provider
    .where({ provider, provider_user_id: providerUserId })
    .first();
  if (linkedIdentity) {
    const linkedUser = await db.orm.public.User.first((user) => user.id.eq(linkedIdentity.userId));
    if (!linkedUser) throw new Error('OAuth identity is linked to a missing user');
    return linkedUser;
  }

  let user = await db.orm.public.User.first((candidate) => candidate.email.eq(email));
  if (!user) {
    const baseUsername = (profile.username || email.split('@')[0] || provider)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 24) || provider;
    const suffix = providerUserId.replace(/[^a-z0-9]/gi, '').slice(-6) || 'account';
    user = await db.orm.public.User.create({
      email,
      username: `${baseUsername}_${suffix}`,
      full_name: displayName,
      avatar_url: profile.photos?.[0]?.value,
      email_verified: true,
    });
  }

  // Persist the provider ID so later logins still find the same user if email changes.
  await db.orm.public.User_Auth_Provider.create({
    userId: user.id,
    provider,
    provider_user_id: providerUserId,
  });
  return user;
}
