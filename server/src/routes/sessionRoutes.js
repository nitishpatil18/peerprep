import { Router } from "express";
import { getSession } from "../controllers/sessionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:id", requireAuth, getSession);

export default router;
