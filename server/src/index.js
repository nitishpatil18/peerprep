import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { getRedis } from "./config/redis.js";
import { initSocket } from "./sockets/index.js";
import { attachYWebsocket } from "./sockets/yWebsocket.js";
import { startMatchmaker } from "./services/matchmakerService.js";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  getRedis();
  const server = http.createServer(app);
  initSocket(server);
  attachYWebsocket(server);
  startMatchmaker();
  server.listen(PORT, () => {
    console.log(`server listening on http://localhost:${PORT}`);
  });
}

start();
