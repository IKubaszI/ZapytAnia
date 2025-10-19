import { Router } from "express";
import {
  getDueReviews,
  submitReview,
  getStats,
  getLearningHistory,
} from "./review.controller";

const router = Router();

router.get("/due", getDueReviews);
router.post("/submit", submitReview);
router.get("/stats", getStats);
router.get("/history", getLearningHistory);
export default router;
