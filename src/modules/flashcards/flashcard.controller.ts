import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import fs from "fs/promises";
import { ensureReviewsForSet } from "../reviews/review.model";

/**
 * 🔹 Import fiszek z pliku .txt (format: angielskie=polskie)
 */
export async function importFlashcards(req: Request, res: Response) {
  try {
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Brak pliku .txt" });
    }

    // ✅ Wczytaj zawartość pliku
    const text = await fs.readFile(req.file.path, "utf-8");

    // ✅ Parsowanie: każda linia to "front=back"
    const cards = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes("="))
      .map((line) => {
        const [front, back] = line.split("=").map((s) => s.trim());
        return { front, back };
      });

    if (!cards.length) {
      return res
        .status(400)
        .json({ message: "Plik nie zawiera poprawnych fiszek." });
    }

    // ✅ Tworzymy nowy zestaw
    const set = await prisma.flashcardSet.create({
      data: { name: name || "Nowy zestaw" },
    });

    // ✅ Zapis fiszek do bazy
    await prisma.flashcard.createMany({
      data: cards.map((c) => ({
        front: c.front,
        back: c.back,
        setId: set.id,
      })),
    });

    // ✅ Sprawdź, czy istnieje tabela Review — tylko jeśli istnieje funkcja
    try {
      await ensureReviewsForSet(1, set.id);
    } catch (err) {
      console.warn("⚠️ Pomijam review.sync — tabela Review może nie istnieć.");
    }

    res.status(201).json({
      message: `✅ Zaimportowano ${cards.length} fiszek z pliku ${req.file.originalname}`,
      setId: set.id,
    });
  } catch (error: any) {
    console.error("❌ Błąd importu fiszek:", error.message);
    res.status(500).json({ message: "Błąd serwera przy imporcie fiszek" });
  }
}

/**
 * 🔹 Pobierz wszystkie zestawy
 */
export async function getAllFlashcards(_req: Request, res: Response) {
  try {
    const sets = await prisma.flashcardSet.findMany({
      include: { cards: true },
      orderBy: { id: "desc" },
    });
    res.json(sets);
  } catch (error) {
    console.error("❌ Błąd pobierania fiszek:", error);
    res.status(500).json({ message: "Błąd pobierania fiszek" });
  }
}

/**
 * 🔹 Pobierz fiszki z danego zestawu (np. dla SRS)
 */
export async function getFlashcardsBySet(req: Request, res: Response) {
  try {
    const setId = Number(req.query.setId);
    if (!setId) return res.status(400).json({ message: "Brak setId" });

    const cards = await prisma.flashcard.findMany({
      where: { setId },
      orderBy: { id: "asc" },
    });

    res.json(cards);
  } catch (error) {
    console.error("❌ Błąd pobierania fiszek z zestawu:", error);
    res.status(500).json({ message: "Błąd serwera przy pobieraniu fiszek" });
  }
}
