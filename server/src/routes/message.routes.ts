import { Router } from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { getAllMessagesofConversation } from "../controllers/message.controllers.js";

const router = Router();

router.route("/:conversationId").get(verifyJWT, getAllMessagesofConversation)

export default router;