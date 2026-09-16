import { conversationService } from "../services/conversation.service.js";
import { messageService } from "../services/message.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from 'express'

const getAllMessagesofConversation = asyncHandler(async(req: Request, res: Response) => {
    // conersationId
    const {conversationId: convId_string} = req.params;
    const conversationId = Number(convId_string);
    if(!conversationId) {
        return res.status(404).json(
            ApiResponse.error("conversation id is missing")
        )
    }
    // verify conversationId
    const conv = await conversationService.getConversation(conversationId)

    if(!conv) {
        return res.status(404).json(
            ApiResponse.error("Invalid Conversation id")
        )
    }

    if(!req.user?.id) {
        return res.status(400).json(
            ApiResponse.error("Unauthorized access")
        )
    } 

    // call getMessages method
    const messages = await messageService.getMessages({conversationId: conv.id, userId: req.user?.id, limit: 50, offset: 0})
    // return list of messages
    return res.status(200).json(
        ApiResponse.success(messages, "Successfully fetch mesages")
    )
})


export {
    getAllMessagesofConversation
}