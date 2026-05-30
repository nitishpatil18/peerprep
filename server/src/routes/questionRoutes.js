import { Router } from "express";
import { listQuestions, getQuestion, getTopics } from "../controllers/questionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, listQuestions);
router.get("/topics", requireAuth, getTopics);
router.get("/:slug", requireAuth, getQuestion);

export default router;
