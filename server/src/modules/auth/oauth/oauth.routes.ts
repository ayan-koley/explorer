import { Router } from 'express';
import {
  startGoogleOAuth,
  startGitHubOAuth,
  googleOAuthCallback,
  githubOAuthCallback,
} from './oauth.controller.js';

const router = Router();

// Visiting these endpoints starts the provider redirect; callbacks complete login.
router.get('/google', startGoogleOAuth);
router.get('/google/callback', googleOAuthCallback);
router.get('/github', startGitHubOAuth);
router.get('/github/callback', githubOAuthCallback);

export default router;
