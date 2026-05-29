import { Router } from "express";
import {
  joinQueue,
  leaveQueue,
  getQueueState,
  respondProposal,
} from "../controllers/matchmakingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/join", requireAuth, joinQueue);
router.post("/leave", requireAuth, leaveQueue);
router.get("/state", requireAuth, getQueueState);
router.post("/respond", requireAuth, respondProposal);

export default router;
