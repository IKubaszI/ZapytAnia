import { Router } from "express";
import { register, login, me, changePassword } from "./auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);
router.put("/change-password", changePassword); // ✅ tu musi być dokładnie tak

export default router;
