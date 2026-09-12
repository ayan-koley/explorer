import * as z from 'zod';

const signUp = z.object({
    full_name: z.string().trim(),
    email: z.email(),
    username: z.string().trim(),
    password: z.string()
});

const signIn = z.object({
    identifier: z.string().min(1),
    password: z.string()
})

export {
    signUp,
    signIn
}