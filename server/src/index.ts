import app from './app';
import 'dotenv/config';
import { db } from './prisma/db';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
}) 