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

app.use("/api/v1/healthcheck", (req: Request, res: Response) => {
    return res.status(200).json({message: "work properly"})
})
app.use("/api/v1/auth", authRoutes);

export default app;