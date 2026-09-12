import { Router } from 'express';
import { signInUser, signOutUser, signUpUser } from '../controllers/auth.controllers.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { authenticateRefreshToken } from '../middlewares/authenticateRefreshToken.js';

const router = Router();


router.route("/signup").post(signUpUser);
router.route("/signin").post(signInUser);
router.route("/signout").post(verifyJWT, authenticateRefreshToken, signOutUser)

export default router;