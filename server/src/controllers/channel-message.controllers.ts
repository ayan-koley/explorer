import { asyncHandler } from "../utils/asyncHandler.js"
import { Request, Response } from "express"
import { ApiResponse } from "../utils/ApiResponse.js"
import { messageService } from "../services/channel-message.service.js"
import { channelService } from "../services/channel.service.js"
import { createMessageSchema, updateMessageSchema } from "../validations/channel-message.validations.js"

const getParamId = (value: string | undefined, name: string) => {
    const id = Number(value)

    if (!value || !Number.isInteger(id) || id <= 0) {
        throw new Error(`${name} must be a positive integer`)
    }

    return id
}


const requireUser = (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json(ApiResponse.error("Unauthorized access"))
        return null
    }

    return req.user
}

const sendMessage = asyncHandler(async(req: Request, res: Response) => {
    const user = requireUser(req, res)
    if (!user) return

    const channelId = getParamId(req.params.channel_id as string, "channel_id")
    const response = createMessageSchema.safeParse(req.body)

    if (!response.success) {
        return res.status(400).json(ApiResponse.error(response.error.message))
    }

    const message = await messageService.sendMessage(channelId, user.id, response.data.content)

    return res.status(201).json(ApiResponse.success(message, "Message sent successfully"))
})

const getMessages = asyncHandler(async(req: Request, res: Response) => {
    const user = requireUser(req, res)
    if (!user) return

    const channelId = getParamId(req.params.channel_id as string, "channel_id")
    // TODO: Implement latter
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined
    const requestedLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50

    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
        return res.status(400).json(ApiResponse.error("limit must be an integer between 1 and 100"))
    }

    const messages = await messageService.getMessages(channelId, user.id, cursor, requestedLimit)

    return res.status(200).json(ApiResponse.success(messages))
})

const getMessage = asyncHandler(async(req: Request, res: Response) => {
    const user = requireUser(req, res)
    if (!user) return

    const messageId = getParamId(req.params.channel_id as string, "message_id")
    const message = await messageService.getMessage(messageId)
    await channelService.getChannel(message.channel_id, user.id)

    return res.status(200).json(ApiResponse.success(message))
})

const editMessage = asyncHandler(async(req: Request, res: Response) => {
    const user = requireUser(req, res)
    if (!user) return

    const messageId = getParamId(req.params.channel_id as string, "message_id")
    const response = updateMessageSchema.safeParse(req.body)

    if (!response.success) {
        return res.status(400).json(ApiResponse.error(response.error.message))
    }

    const message = await messageService.editMessage(messageId, user.id, response.data.content)

    return res.status(200).json(ApiResponse.success(message, "Message updated successfully"))
})

const deleteMessage = asyncHandler(async(req: Request, res: Response) => {
    const user = requireUser(req, res)
    if (!user) return

    const messageId = getParamId(req.params.channel_id as string, "message_id")
    await messageService.deleteMessage(messageId, user.id)

    return res.status(204).send()
})

export {
    sendMessage,
    getMessage,
    getMessages,
    editMessage,
    deleteMessage
}