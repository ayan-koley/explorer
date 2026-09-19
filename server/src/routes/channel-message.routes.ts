import { Router } from "express"
import {
	deleteMessage,
	editMessage,
	getMessage,
	getMessages,
	sendMessage,
} from "../controllers/channel-message.controllers.js"
import { verifyJWT } from "../middlewares/verifyJWT.js"

const router = Router()

router.route("/channel/:channel_id")
	.post(verifyJWT, sendMessage)
	.get(verifyJWT, getMessages)

router.route("/message/:message_id")
	.get(verifyJWT, getMessage)
	.patch(verifyJWT, editMessage)
	.delete(verifyJWT, deleteMessage)

export default router