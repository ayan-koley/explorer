// utils/token.ts
import jwt, { JwtPayload } from 'jsonwebtoken'
import crypto from 'crypto'

interface User {
    id: number,
    full_name: string,
    email?: string,
    username: string
}
interface UserJwtpayload extends JwtPayload {
    id: number,
    full_name: string,
    email?: string,
    username: string
}

export function generateAccessToken(payload: User): string {
    const accessToken_secret = process.env.JWT_ACCESS_TOKEN_SECRET;

    if(!accessToken_secret) {
        throw new Error('accesstoken secret is missing');
    }

    const accessToken = jwt.sign(payload, accessToken_secret);

    return accessToken;
}

export function generateRefreshToken(payload: {id: number}): {refreshToken: string, jti: string} {
     const refreshToken_secret = process.env.JWT_REFRESH_TOKEN_SECRET;

    if(!refreshToken_secret) {
        throw new Error('refreshtoken secret is missing');
    }

    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign(payload, refreshToken_secret, {
        expiresIn: '15d',
        jwtid: jti
    });

    return {
        refreshToken,
        jti
    };
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