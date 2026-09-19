import { Router } from "express"
import {
	createChannel,
	deleteChannel,
	getChannel,
	getChannels,
	updateChannel,
} from "../controllers/channel.controllers.js"
import { verifyJWT } from "../middlewares/verifyJWT.js"

const router = Router()

router.route("/server/:server_id")
	.post(verifyJWT, createChannel)
	.get(verifyJWT, getChannels)

router.route("/:channel_id")
	.get(verifyJWT, getChannel)
	.patch(verifyJWT, updateChannel)
	.delete(verifyJWT, deleteChannel)

export default router