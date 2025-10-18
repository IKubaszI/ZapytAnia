import { Router } from "express";
import multer from "multer";
import {
  importFlashcards,
  getAllFlashcards,
  getFlashcardsBySet,
} from "./flashcard.controller";

const router = Router();
const upload = multer({ dest: "uploads/" }); // ważne, by katalog istniał!

router.post("/import", upload.single("file"), importFlashcards);
router.get("/", getAllFlashcards);
router.get("/set", getFlashcardsBySet);

export default router;
