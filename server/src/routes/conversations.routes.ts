import { Router } from 'express';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import { createConversation, getConversationById, getUserConversations } from '../controllers/conversation.controllers.js';

const router = Router();


router.route("/").get(verifyJWT, getUserConversations);
router.route("/:conversationId").get(verifyJWT, getConversationById);
router.route("/direct").post(verifyJWT, createConversation);

export default router;