import express, { urlencoded } from 'express';
import cors from 'cors';

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


export default app;