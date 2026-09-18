import { asyncHandler } from "../utils/asyncHandler.js"
import { Request, Response } from "express"
import { ApiResponse } from "../utils/ApiResponse.js"
import { servermemberService } from "../services/server-member.service.js"
import {
    getMemberParams,
    memberBodySchema,
    memberParamsSchema,
    nicknameBodySchema,
    targetMemberParamsSchema,
} from "../validations/server-member.validations.js"

const getMembers = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const { serverId } = getMemberParams(req.params, memberParamsSchema)
    const members = await servermemberService.getServerMembers(serverId, req.user.id)

    return res.status(200).json(ApiResponse.success(members, "Server members fetched successfully"))
})
const addMember = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const { serverId } = getMemberParams(req.params, memberParamsSchema)
    const body = memberBodySchema.safeParse(req.body)

    if(!body.success) {
        return res.status(400).json(ApiResponse.error(body.error.message))
    }

    await servermemberService.requireMember({
        server_id: serverId,
        user_id: req.user.id
    })

    const member = await servermemberService.addMember({
        server_id: serverId,
        user_id: body.data.user_id,
        nickname: body.data.nickname
    })

    return res.status(201).json(ApiResponse.success(member, "Member added successfully"))
})
const removeMember = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const { serverId, userId } = getMemberParams(req.params, targetMemberParamsSchema)

    await servermemberService.requireMember({
        server_id: serverId,
        user_id: req.user.id
    })

    const member = await servermemberService.removeMember({
        server_id: serverId,
        user_id: userId!
    })

    return res.status(200).json(ApiResponse.success(member, "Member removed successfully"))
})
const updateMember = asyncHandler(async(req: Request, res: Response) => {
    if(!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized access"))
    }

    const { serverId } = getMemberParams(req.params, memberParamsSchema)
    const body = nicknameBodySchema.safeParse(req.body)

    if(!body.success) {
        return res.status(400).json(ApiResponse.error(body.error.message))
    }

    await servermemberService.requireMember({
        server_id: serverId,
        user_id: req.user.id
    })

    const member = await servermemberService.updateMember({
        server_id: serverId,
        user_id: req.user.id,
        nickname: body.data.nickname ?? undefined
    })

    return res.status(200).json(ApiResponse.success(member, "Member updated successfully"))
})

export {
    getMembers,
    addMember,
    removeMember,
    updateMember
}