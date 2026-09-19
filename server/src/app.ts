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
    origin: 'http://localhost:5173'
}));
app.use(cookieParser())


import authRoutes from './routes/auth.routes.js';
import conversationsRoutes from './routes/conversations.routes.js';
import messagesRoutes from './routes/message.routes.js';
import serverRoutes from './routes/server.routes.js';
import channelRoutes from './routes/channel.routes.js';
import channelMessageRoutes from './routes/channel-message.routes.js';
import serverMemberRoutes from './routes/server-member.routes.js';

app.use("/api/v1/healthcheck", (req: Request, res: Response) => {
    return res.status(200).json({message: "work properly "})
})
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/conversations", conversationsRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/servers", serverRoutes);
app.use("/api/v1/channels", channelRoutes);
app.use("/api/v1/channel-messages", channelMessageRoutes);
app.use("/api/v1/server-members", serverMemberRoutes);

export default app;