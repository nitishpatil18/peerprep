import { Router } from "express";
import { getSession, endSession, listMySessions } from "../controllers/sessionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, listMySessions);
router.get("/:id", requireAuth, getSession);
router.post("/:id/end", requireAuth, endSession);

export default router;
