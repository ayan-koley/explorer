import * as z from 'zod';

const messageValidation = z.object({
    conversationId: z.number(),
    senderId: z.number(),
    content: z.string().trim()
});





export {
    messageValidation
}