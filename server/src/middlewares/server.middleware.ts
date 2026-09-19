import { NextFunction, Request, Response } from "express"
import { ApiResponse } from "../utils/ApiResponse.js"
import { servermemberService } from "../services/server-member.service.js"
import { serverService } from "../services/server.service.js"

const getServerId = (req: Request) => {
	const value = req.params.serverId ?? req.params.server_id
	const serverId = Number(value)

	if (!value || !Number.isInteger(serverId) || serverId <= 0) {
		return null
	}

	return serverId
}

const requireAuthenticatedUser = (req: Request, res: Response) => {
	if (!req.user) {
		res.status(401).json(ApiResponse.error("Unauthorized access"))
		return null
	}

	return req.user
}

/** Require the authenticated user to be a member of the requested server. */
export const requireServerMember = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const user = requireAuthenticatedUser(req, res)
	if (!user) return

	const serverId = getServerId(req)
	if (!serverId) {
		return res.status(400).json(ApiResponse.error("serverId must be a positive integer"))
	}

	try {
		await servermemberService.requireMember({
			server_id: serverId,
			user_id: user.id
		})
		return next()
	} catch (error) {
		if (error instanceof Error && error.message.toLowerCase().includes("not a member")) {
			return res.status(403).json(ApiResponse.error(error.message))
		}

		return next(error)
	}
}

/** Require the authenticated user to own the requested server. */
export const requireServerOwner = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const user = requireAuthenticatedUser(req, res)
	if (!user) return

	const serverId = getServerId(req)
	if (!serverId) {
		return res.status(400).json(ApiResponse.error("serverId must be a positive integer"))
	}

	try {
		const server = await serverService.getServer({
			server_id: serverId,
			user_id: user.id
		})

		if (server.owner_id !== user.id) {
			return res.status(403).json(ApiResponse.error("User is not the owner of the server"))
		}

		return next()
	} catch (error) {
		return next(error)
	}
}
