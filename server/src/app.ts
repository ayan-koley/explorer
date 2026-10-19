import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import { Request, Response} from 'express'

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
export default app;
