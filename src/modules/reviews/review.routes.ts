import { Router } from "express";
import { getDueReviews, submitReview, getStats } from "./review.controller";

const router = Router();

router.get("/due", getDueReviews);
router.post("/submit", submitReview);
router.get("/stats", getStats); // 🔹 Nowa trasa statystyk

export default router;
