import { conversationService } from "../services/conversation.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";

const createConversation = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(400).json(
            ApiResponse.error("unauthorized user")
        )
    }
    const userId1 = req.user?.id;
    const {user_id: userId2} = req.body;

    if(!userId2) {
        return res.status(400).json(
            ApiResponse.error("user id is missing")
        )
    }
    const conversation = await conversationService.findOrCreateDirectConversation(userId1, userId2)

    return res.status(200).json(
        ApiResponse.success(conversation, "Conversation created successfully")
    )
})

const getUserConversations = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(400).json(
            ApiResponse.error("unauthorized user")
        )
    }

    const conversations = await conversationService.getConversationsOfUser(req.user.id);

    return res.status(200).json(
        ApiResponse.success(conversations, "Fetch all conversations successfully")
    )
})

const getConversationById = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(400).json(
            ApiResponse.error("unauthorized user")
        )
    }

    const {conversationId} = req.params;

    const convId = Number(conversationId);

    if(!convId) {
        return res.status(404).json(
            ApiResponse.error("Conversation id is missing")
        )
    }

    const conversation = await conversationService.getConversationById(convId);

    return res.status(200).json(
        ApiResponse.success(conversation, "Successfully fetch the conversation")
    )
})

export {
    createConversation,
    getUserConversations,
    getConversationById
}