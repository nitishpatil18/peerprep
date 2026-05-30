import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import matchmakingRoutes from "./routes/matchmakingRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "peerprep-server", ts: Date.now() });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
