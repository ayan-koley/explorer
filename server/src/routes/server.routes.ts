import { Router } from "express"
import {
	createServer,
	deleteServer,
	getMyServers,
	getServerById,
	updateServer,
} from "../controllers/server.controllers.js"
import { verifyJWT } from "../middlewares/verifyJWT.js"

const router = Router()

router.use(verifyJWT)

router.route("/")
	.post(createServer)
	.get(getMyServers)

router.route("/:server_id")
	.get(getServerById)
	.patch(updateServer)
	.delete(deleteServer)

export default router
