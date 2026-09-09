// utils/token.ts
import jwt, { JwtPayload } from 'jsonwebtoken'

interface User {
    id: Number,
    full_name: String,
    email?: String,
    username: String
}
interface UserJwtpayload extends JwtPayload {
    id: Number,
    full_name: String,
    email?: String,
    username: String
}

export function generateAccessToken(payload: User): String {
    const accessToken_secret = process.env.JWT_ACCESS_TOKEN_SECRET;

    if(!accessToken_secret) {
        throw new Error('accesstoken secret is missing');
    }

    const accessToken = jwt.sign(payload, accessToken_secret);

    return accessToken;
}

export function generateRefreshToken(payload: User): String {
     const refreshToken_secret = process.env.JWT_REFRESH_TOKEN_SECRET;

    if(!refreshToken_secret) {
        throw new Error('refreshtoken secret is missing');
    }

    const refreshToken = jwt.sign(payload, refreshToken_secret);

    return refreshToken;
}

export function verifyAccessToken(token: string): User {
    const accessToken_secret = process.env.JWT_ACCESS_TOKEN_SECRET;

    if(!accessToken_secret) {
        throw new Error('accesstoken secret is missing');
    }
    const user = jwt.verify(token, accessToken_secret) as UserJwtpayload;

    if(typeof user === 'string' || !user) {
        throw new Error("Invalid accesstoken ")
    }
    return user;
}