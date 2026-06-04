import { getUserSkillRatings } from "../services/skillRatingService.js";

export async function getMySkillRatings(req, res) {
  const ratings = await getUserSkillRatings(req.user.id);
  res.json({ ratings });
}
