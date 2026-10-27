import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import { NextFunction, Request, Response} from 'express'
import { ApiResponse } from './utils/ApiResponse.js'

const app = express();

app.use(urlencoded(
    {
        extended: true,
        limit: '1mb'
    }
));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(cookieParser())


import authRoutes from './modules/auth/auth.routes.js';
import oauthRoutes from './modules/auth/oauth/oauth.routes.js';
import serverRoutes from './modules/servers/servers.routes.js';
import messageRoutes from './modules/messages/messages.routes.js';
import directMessageRoutes from './modules/messages/direct-messages.routes.js';


app.use("/api/v1/healthcheck", (req: Request, res: Response) => {
    return res.status(200).json({message: "Healthy Server 😀🔥"})
})
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/oauth", oauthRoutes);
app.use("/api/v1/servers", serverRoutes);
app.use("/api/v1", messageRoutes);
app.use("/api/v1/direct", directMessageRoutes);

app.use((error: { status?: number }, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    const status = error.status === 503 ? 503 : error.status === 502 ? 502 : 500;
    const message = status === 503
        ? 'Image uploads are not configured. Add IMAGEKIT_PRIVATE_KEY to the server environment.'
        : status === 502
            ? 'Image upload service failed. Check the ImageKit configuration and try again.'
            : 'The server could not complete the request.';
    return res.status(status).json(ApiResponse.error(message));
});
export default app;
