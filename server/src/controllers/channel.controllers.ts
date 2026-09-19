import { asyncHandler } from "../utils/asyncHandler.js"
import { Request, Response } from "express"
import { ApiResponse } from "../utils/ApiResponse.js"
import { channelService } from "../services/channel.service.js"
import { createChannelSchema, updateChannelSchema } from "../validations/channel.valdiations.js"

const getParamId = (value: string | undefined, name: string) => {
    const id = Number(value)

    if (!value || !Number.isInteger(id) || id <= 0) {
        throw new Error(`${name} must be a positive integer`)
    }

    return id
}

const createChannel = asyncHandler(async(req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }
    

    const serverId = getParamId(req.params.server_id as string, "serverId")
    const response = createChannelSchema.safeParse(req.body)

    if (!response.success) {
        return res.status(400).json(ApiResponse.error(response.error.message))
    }

    const channel = await channelService.createChannel({
        server_id: serverId,
        user_id: req.user.id,
        name: response.data.name,
        type: response.data.type,
        position: response.data.position
    })

    return res.status(201).json(ApiResponse.success(channel, "Channel created successfully"))
})

const getChannels = asyncHandler(async(req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const serverId = getParamId(req.params.server_id as string, "serverId")
    const channels = await channelService.getServerChannels(serverId, req.user.id)

    return res.status(200).json(ApiResponse.success(channels))
})

const getChannel = asyncHandler(async(req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const channelId = getParamId(req.params.channel_id as string, "channelId")
    const channel = await channelService.getChannel(channelId, req.user.id)

    return res.status(200).json(ApiResponse.success(channel))
})

const updateChannel = asyncHandler(async(req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const channelId = getParamId(req.params.channel_id as string, "channelId")
    const response = updateChannelSchema.safeParse(req.body)

    if (!response.success) {
        return res.status(400).json(ApiResponse.error(response.error.message))
    }

    const channel = await channelService.updateChannel(channelId, req.user.id, response.data)

    return res.status(200).json(ApiResponse.success(channel, "Channel updated successfully"))
})

const deleteChannel = asyncHandler(async(req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const channelId = getParamId(req.params.channel_id as string, "channelId")
    await channelService.deleteChannel(channelId, req.user.id)

    return res.status(204).send()
})

export {
    createChannel,
    getChannels,
    getChannel,
    updateChannel,
    deleteChannel
}