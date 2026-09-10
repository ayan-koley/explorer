import {Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";
import {TokenExpiredError} from 'jsonwebtoken'
import { ApiResponse } from "../utils";

export const verifyJWT = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1] || req.cookies.accessToken;

        if(!token) {
            throw new Error('token is missing');
        }

        const user = verifyAccessToken(token);

        req.user = user;

        next();

    } catch (err: any) {
        if(err instanceof TokenExpiredError) {
            return res.status(401).json(
                ApiResponse.error(err.message)
            )
        }

        return res.status(400).json(
            ApiResponse.error(err.message)
        )
    }
} 