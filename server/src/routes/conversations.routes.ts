import { Router } from 'express';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { createConversation } from '../controllers/conversation.controllers.js';

const router = Router();


router.route("/direct").post(verifyJWT, createConversation);

export default router;