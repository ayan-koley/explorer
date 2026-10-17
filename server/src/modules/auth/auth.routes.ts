import { Router } from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { authenticateRefreshToken } from '../../middlewares/authenticateRefreshToken.js';
import {signInUser, signOutUser, signUpUser, verifyEmailOtpController, resendOTP} from './auth.controllers.js';
import oauthRoutes from './oauth/oauth.routes.js';

const router = Router();

router.use('/oauth', oauthRoutes);

router.route("/signup").post(signUpUser);
router.post("/verify-email-otp", verifyEmailOtpController);
router.route("/signin").post(signInUser);
router.route("/signout").post(verifyJWT, authenticateRefreshToken, signOutUser);
router.route("/resend-otp").post(resendOTP);
export default router;
