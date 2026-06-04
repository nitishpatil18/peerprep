import { Router } from "express";
import { getMySkillRatings } from "../controllers/skillController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getMySkillRatings);

export default router;
