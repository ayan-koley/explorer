import app from './app.js';
import 'dotenv/config';
import { createWebSocketServer } from './websocket/websocket.server.js';

const HTTP_PORT = process.env.HTTP_PORT || 8080;
const WS_PORT = process.env.WS_PORT || 3001;

createWebSocketServer({port: WS_PORT});
app.listen(HTTP_PORT, () => {
    console.log(`server is running on http://localhost:${HTTP_PORT}`);
})
