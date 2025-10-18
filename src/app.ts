import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

// 🔹 Import tras
import flashcardRoutes from "./modules/flashcards/flashcard.routes";
import authRoutes from "./modules/auth/auth.routes";
import reviewRoutes from "./modules/reviews/review.routes";

const app = express();

// ===== Middleware =====
app.use(
  cors({
    origin: "*", // 🔓 Dla testów lokalnych — pełny dostęp bez ograniczeń
  })
);
app.use(express.json());
app.use(cookieParser());

// ===== API routes =====

// 🔓 Rejestracja i logowanie — zostaje, ale nie wymagane
app.use("/api/auth", authRoutes);

// 🔓 Publiczne — każdy może importować i przeglądać fiszki
app.use("/api/flashcards", flashcardRoutes);

// 🔓 Publiczne — każdy może powtarzać fiszki (bez tokena)
app.use("/api/reviews", reviewRoutes);

// ===== Serwowanie frontendu =====
app.use(express.static(path.join(__dirname, "../public")));

// ===== Test endpoint =====
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server is healthy ✅" });
});

// ===== Strona główna =====
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

export default app;
