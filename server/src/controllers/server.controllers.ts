import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Request, Response } from "express"
import { createServerSchema, updateServerSchema } from "../validations/server.validations.js"
import { serverService } from "../services/server.service.js"
import { servermemberService } from "../services/server-member.service.js"
import { channelService } from "../services/channel.service.js"

const createServer = asyncHandler(async(req: Request, res: Response) => {

    if(!req.user) {
        return res.status(400).json(ApiResponse.error("Unauthorized access"))
    }
    const response = createServerSchema.safeParse(req.body);

    if(!response.success) {
        return res.status(200)
        .json(
            ApiResponse.error(response.error.message)
        )
    }

    const server = await serverService.createServer({owner_id: req.user.id, ...response.data});

    const serverMember = await servermemberService.addMember({server_id: server.id, user_id: req.user.id});

    const channel = await channelService.createChannel({server_id: server.id, name: "general", type: "text"})

    return res.status(201).json(
        ApiResponse.success({
            server,
            channel
        }, "Successfully create channel")
    )

})
const getMyServers = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        throw new Error("unauthorized access")
    }

    const servers = await serverService.getUserServers(req.user.id);

    return servers;
})
const getServerById = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        throw new Error("unauthorized access")
    }
    const {server_id} = req.params;

    if(!server_id) {
        return res.status(400).json(
            ApiResponse.error("server is missing in params")
        )
    }


    const server = await serverService.getServer({ server_id: Number(server_id), user_id: req.user.id});

    return server;
})
const updateServer = asyncHandler(async(req: Request, res: Response) => {
    const {server_id} = req.params;
    const response = updateServerSchema.safeParse(req.body);

    if(!response.success) {
        return res.status(400).json(
            ApiResponse.error(response.error.message)
        )
    }

    const server = await serverService.updateServer({server_id: Number(server_id), user_id: req.user?.id!, data: response.data});

    return server;
})

const deleteServer = asyncHandler(async(req: Request, res: Response) => {

})

export {
    createServer,
    getMyServers,
    getServerById,
    updateServer,
    deleteServer
}