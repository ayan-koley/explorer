import { ApiResponse, asyncHandler } from "../utils/index.js";
import {generateHash, isValidHash} from "../utils/hash.js";
import { signIn, signUp } from "../validations/auth.validations.js";
import { Request, Response } from "express";
import {db} from '../prisma/db.js'
import { or } from "@prisma/orm-postgres/orm-client";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

const signUpUser = asyncHandler(async(req: Request, res: Response) => {
    const response = signUp.safeParse(req.body);

    if(!response.success){
        return res.status(400).json(
            ApiResponse.error(response.error.message)
        )
    }

    const { email, full_name, username, password } = response.data;

    // hash password
    const hashPassword = await generateHash(password);
    // store into database
    const newUser = await db.orm.public.User.create({
        email,
        full_name,
        username,
        password_hash: hashPassword
    })

    console.log(`new user is created ${newUser}`);
    // return response
    return res.status(201).json(
        ApiResponse.success(null, 'User created Successfully')
    )
})
const signInUser = asyncHandler(async(req: Request, res: Response) => {
    // validate user using zod
    const response = signIn.safeParse(req.body);
    if(!response.success) {
        return res.status(400).json(
            ApiResponse.error(response.error.message)
        )
    }
    const { identifier, password } = response.data;
    
    const user = await db.orm.public.User.first((u) => or(u.username.eq(identifier), u.email.eq(identifier)))

    if(!user) {
        return res.status(404).json(
            ApiResponse.error(`user not found use different identifier ${identifier}`)
        )
    }
    // validate password
    const isValidPassword = await isValidHash(password, user?.password_hash!);

    if(!isValidPassword) {
        return res.status(400).json(
            ApiResponse.error('Wrong password')
        )
    }
    // generate access and refresh token
    const accessToken = generateAccessToken({id: user.id, full_name: user.full_name, username: user.username});
    
    const { refreshToken, jti } = generateRefreshToken({id: user.id});

    const expirationDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    await db.orm.public.RefreshToken.create({
        user_id: user.id,
        token_id: jti,  
        expires_at: expirationDate.toISOString()
    })
    // store refreshToken
    // return access and refreshToken in cookies and user details
    return res.status(200)
    .cookie('accessToken', accessToken, {maxAge: 7 * 60 * 60 * 1000, httpOnly: true, secure: true})
    .cookie('refreshToken', refreshToken, {maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true})
    .json(
        ApiResponse.success(user, "Login Successfully ")
    )
})

const signOutUser = asyncHandler(async(req: Request, res: Response) => {
    const token = req.token;
    

    await db.orm.public.RefreshToken.where({token_id: token?.jti}).update({
        revoked_at: new Date(Date.now()).toISOString()
    })

    return res.status(200).clearCookie('accessToken').clearCookie('refreshToken').json(
        ApiResponse.success(null, 'Logout successfully')
    )
})

const refreshAccessToken = asyncHandler(async(req: Request, res: Response) => {
    const token = req.token;

    const refresh = await db.orm.public.RefreshToken.where({token_id: token?.jti}).all();

    if(refresh[0].revoked_at) {
        return res.status(400).json(
            ApiResponse.error('Invalid refresh token')
        )
    }

    const [user] = await db.orm.public.User.where({id: refresh[0].user_id}).all();

    const accessToken = generateAccessToken(
        {
            id: user.id,
            full_name: user.full_name,
            username: user.username
        }
    )

    return res.status(200)
    .cookie('accessToken', accessToken, {maxAge: 7 * 60 * 60 * 1000, httpOnly: true, secure: true})
    .json(
        ApiResponse.success(null, "access token generate successfully")
    )

})

export {
    signUpUser,
    signInUser,
    signOutUser,
    refreshAccessToken
}