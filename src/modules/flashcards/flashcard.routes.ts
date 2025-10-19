import { Router } from "express";
import multer from "multer";
import {
  importFlashcards,
  getAllFlashcards,
  getFlashcardsBySet,
  deleteFlashcardSet,
} from "./flashcard.controller";

const router = Router();
const upload = multer({ dest: "uploads/" });

// 🔹 Import fiszek
router.post("/import", upload.single("file"), importFlashcards);

// 🔹 Wszystkie zestawy
router.get("/all", getAllFlashcards);

// 🔹 Zestaw po ID
router.get("/set/:id", getFlashcardsBySet);

// 🔹 Usuń zestaw
router.delete("/delete/:id", deleteFlashcardSet);

export default router;
