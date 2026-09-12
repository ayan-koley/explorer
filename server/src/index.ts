import app from './app.js';
import 'dotenv/config';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
}) 