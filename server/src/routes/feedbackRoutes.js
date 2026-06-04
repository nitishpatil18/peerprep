import { Router } from "express";
import { submitFeedback, getMyFeedbackForSession } from "../controllers/feedbackController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/sessions/:sessionId/feedback", requireAuth, submitFeedback);
router.get("/sessions/:sessionId/feedback/me", requireAuth, getMyFeedbackForSession);

export default router;
