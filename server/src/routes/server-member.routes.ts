import { Router } from "express"
import {
	addMember,
	getMembers,
	removeMember,
	updateMember,
} from "../controllers/server-member.controllers.js"
import { verifyJWT } from "../middlewares/verifyJWT.js"

const router = Router()

router.route("/server/:serverId")
	.get(verifyJWT, getMembers)
	.post(verifyJWT, addMember)
	.patch(verifyJWT, updateMember)

router.route("/server/:serverId/:userId")
	.delete(verifyJWT, removeMember)

export default router