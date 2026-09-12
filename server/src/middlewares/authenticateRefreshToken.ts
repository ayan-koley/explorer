import {Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken } from "../utils/token.js";
import jwt from 'jsonwebtoken'
import { ApiResponse } from "../utils/index.js";

export const authenticateRefreshToken = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1] || req.cookies.refreshToken;

        if(!token) {
            throw new Error('token is missing');
        }

        const {id, jti} = verifyRefreshToken(token);

        req.user = {id};
        req.token = {
            refreshToken: token,
            jti
        }

        next();

    } catch (err: any) {
        if(err instanceof jwt.TokenExpiredError) {
            return res.status(400).json(
                ApiResponse.error(err.message)
            )
        }

        return res.status(400).json(
            ApiResponse.error(err.message)
        )
    }
} 