import { ApiResponse, asyncHandler } from "../../utils/index.js";
import {generateHash, isValidHash} from "../../utils/hash.js";
import { signIn, signUp } from "../../validations/auth.validations.js";
import { Request, Response } from "express";
import {db} from '../../prisma/db.js'
import { or } from "@prisma/orm-postgres/orm-client";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.js";
import { generateOTP, verifyOTP } from "../../utils/otp.js";
import { sendOtpEmail } from "./auth.service.js";

// Create a pending account and send OTP
const signUpUser = asyncHandler(async(req: Request, res: Response) => {
    const response = signUp.safeParse(req.body);

    if(!response.success){
        return res.status(400).json(
            ApiResponse.error(response.error.message)
        )
    }

    const { email, full_name, username, password } = response.data;

    const existingUser = await db.orm.public.User.first((u) => or(u.email.eq(email), u.username.eq(username)));

    console.log(`Existing user: ${existingUser}`);

    if(existingUser && !existingUser.email_verified) {
        return res.status(400).json(
            ApiResponse.success(
                {
                    "status": "VERIFICATION_REQUIRED",
                    "nextStep": "VERIFY_EMAIL",
                    "email": email
                }, 
                'Your account is awaiting verification. A new OTP has been sent.')
        )
    }
    
    if(existingUser) {
        return res.status(400).json(
            ApiResponse.error('User already exists')
        )
    }

    // hash password
    const hashPassword = await generateHash(password);
    // store into database
    const newUser = await db.orm.public.User.create({
        email,
        full_name,
        username,
        password_hash: hashPassword,
        email_verified: false,
    })

    const otp = generateOTP();
    const otpHash = await generateHash(otp);
    await db.orm.public.EmailVerificationOTP.create({
        user_id: newUser.id,
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now()).toISOString(),
    })
    const emailOtp = await sendOtpEmail(email, {username, otp});

    if(emailOtp.error) {
        ApiResponse.error(`Error sending email ${emailOtp.error.message}`);
    }

    return res.status(201).json(
        ApiResponse.success({success: true}, 'Verification code sent to your email')
    )
})

const verifyEmailOtpController = asyncHandler(async(req: Request, res: Response) => {

    const {email, otp} = req.body;
    if(!email || !otp) {
        return res.status(400).json(
            ApiResponse.error('Email and OTP are required')
        )
    }

    const pendingUser = await db.orm.public.User.first((u) => u.email.eq(email));

    if(!pendingUser) {
        return res.status(404).json(
            ApiResponse.error('User not found')
        )
    }

    const otpRecord = await db.orm.public.EmailVerificationOTP.first((o) => o.user_id.eq(pendingUser.id));

    if(!otpRecord) {
        return res.status(404).json(
            ApiResponse.error('OTP not found')
        )
    }

    if(otpRecord.attempt_count >= 5) {
        return res.status(400).json(
            ApiResponse.error('Maximum OTP attempts exceeded')
        )   
    }

    if(new Date(otpRecord.expires_at).toISOString() < new Date(Date.now()).toISOString()) {
        return res.status(400).json(
            ApiResponse.error('OTP expired')
        )
    }

    const isValidOtp = verifyOTP(otp, otpRecord.otp_hash);

    if(!isValidOtp) {
        return res.status(400).json(
            ApiResponse.error('Invalid OTP')
        )
    }

    // transaction to update user email_verified and delete otp record
    const result = await db.transaction(async (tx) => {
        await tx.orm.public.User.where({id: pendingUser.id}).update({
            email_verified: true
        })
        await tx.orm.public.EmailVerificationOTP.where({user_id: pendingUser.id}).delete();
    })

    return res.status(200).json(
        ApiResponse.success({success: true}, 'Email verified successfully')
    )

})

const resendOTP = asyncHandler(async(req: Request, res: Response) => {
    const {email} = req.body;

    if(!email) {
        return res.status(400).json(
            ApiResponse.error('Email is required')
        )
    }

    const user = await db.orm.public.User.first((u) => u.email.eq(email));

    if(!user) {
        return res.status(404).json(
            ApiResponse.error('User not found')
        )
    }

    if(user.email_verified) {
        return res.status(400).json(
            ApiResponse.error('Email already verified')
        )
    }

    const otp = generateOTP();
    const otpHash = await generateHash(otp);
    const otpRecord = await db.orm.public.EmailVerificationOTP.first((o) => o.user_id.eq(user.id));
    if(!otpRecord) {
        return res.status(404).json(
            ApiResponse.error('OTP record not found')
        )
    }

    await db.orm.public.EmailVerificationOTP.where({id: otpRecord.id}).update({
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempt_count: otpRecord.attempt_count + 1,
        createdAt: new Date(Date.now()).toISOString(),
    });

    const emailOtp = await sendOtpEmail(email, {username: user.username, otp});

    if(emailOtp.error) {
        return res.status(500).json(
            ApiResponse.error(`Error sending email ${emailOtp.error.message}`)
        )
    }

    return res.status(200).json(
        ApiResponse.success({success: true}, 'New verification code sent to your email')
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

    if(!user.email_verified) {
        return res.status(400).json(
            ApiResponse.error('Email not verified')
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
    const hashRefreshToken = await generateHash(refreshToken);

    const expirationDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    await db.orm.public.RefreshToken.create({
        user_id: user.id,
        token_id: jti,  
        hash_refresh_token: hashRefreshToken,
        expires_at: expirationDate.toISOString()
    })
    // store refreshToken
    // return access and refreshToken in cookies and user details

    const userDetails = await db.orm.public.User.select("id", "full_name", "username", "email").where((u) => u.id.eq(user.id)).first();
    return res.status(200)
    .cookie('accessToken', accessToken, {maxAge: 7 * 60 * 60 * 1000, httpOnly: true, secure: true})
    .cookie('refreshToken', refreshToken, {maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true})
    .json(
        ApiResponse.success(userDetails, "User logged in Successfully ")
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

// const refreshAccessToken = asyncHandler(async(req: Request, res: Response) => {
//     const token = req.token;

//     const refresh = await db.orm.public.RefreshToken.where({token_id: token?.jti}).all();

//     if(refresh[0].revoked_at) {
//         return res.status(400).json(
//             ApiResponse.error('Invalid refresh token')
//         )
//     }

//     const [user] = await db.orm.public.User.where({id: refresh[0].user_id}).all();

//     const accessToken = generateAccessToken(
//         {
//             id: user.id,
//             full_name: user.full_name,
//             username: user.username
//         }
//     )

//     return res.status(200)
//     .cookie('accessToken', accessToken, {maxAge: 7 * 60 * 60 * 1000, httpOnly: true, secure: true})
//     .json(
//         ApiResponse.success(null, "access token generate successfully")
//     )

// })

export {
    signUpUser,
    verifyEmailOtpController,
    signInUser,
    signOutUser,
    resendOTP
    // refreshAccessToken
}