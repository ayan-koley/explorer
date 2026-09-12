
import express from "express";

declare global {
  namespace Express {
    interface RequestUser {
        id: number,
        full_name?: string,
        email?: string,
        username?: string
    }
    interface RequestToken {
      refreshToken: string,
      jti: string
    }
    export interface Request {
      user?: RequestUser,
      token?: RequestToken
    }
  }
}
