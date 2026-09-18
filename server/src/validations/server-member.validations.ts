import { z } from "zod"

export const memberParamsSchema = z.object({
    serverId: z.coerce.number().int().positive(),
})

export const targetMemberParamsSchema = memberParamsSchema.extend({
    userId: z.coerce.number().int().positive(),
})

export const memberBodySchema = z.object({
    user_id: z.coerce.number().int().positive(),
    nickname: z.string().trim().max(100).optional(),
})

export const nicknameBodySchema = z.object({
    nickname: z.string().trim().max(100).nullable().optional(),
})

export const getMemberParams = (params: unknown, schema: z.ZodTypeAny) => {
    const result = schema.safeParse(params)

    if(!result.success) {
        throw new Error("Invalid member parameters")
    }

    return result.data as { serverId: number, userId?: number }
}