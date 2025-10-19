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
    if (!req.file) return res.status(400).json({ message: "Brak pliku .txt" });

    const text = await fs.readFile(req.file.path, "utf-8");
    const cards = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes("="))
      .map((line) => {
        const [front, back] = line.split("=").map((s) => s.trim());
        return { front, back };
      });

    if (!cards.length)
      return res.status(400).json({ message: "Plik nie zawiera poprawnych fiszek." });

    const set = await prisma.flashcardSet.create({
      data: { name: name || "Nowy zestaw" },
    });

    await prisma.flashcard.createMany({
      data: cards.map((c) => ({
        front: c.front,
        back: c.back,
        setId: set.id,
      })),
    });

    try {
      await ensureReviewsForSet(1, set.id);
    } catch {
      console.warn("⚠️ Pomijam review.sync — tabela Review może nie istnieć.");
    }

    res.status(201).json({
      message: `✅ Zaimportowano ${cards.length} fiszek.`,
      setId: set.id,
    });
  } catch (err) {
    console.error("❌ Błąd importu fiszek:", err);
    res.status(500).json({ message: "Błąd serwera przy imporcie fiszek" });
  }
}

/**
 * 🔹 Pobierz wszystkie zestawy (dla panelu)
 */
export async function getAllFlashcards(_req: Request, res: Response) {
  try {
    const sets = await prisma.flashcardSet.findMany({
      include: {
        cards: true,
      },
      orderBy: { id: "desc" },
    });

    const result = sets.map((set) => ({
      id: set.id,
      name: set.name,
      count: set.cards.length,
      createdAt: set.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Błąd pobierania zestawów:", err);
    res.status(500).json({ message: "Błąd serwera przy pobieraniu zestawów." });
  }
}

/**
 * 🔹 Pobierz wszystkie fiszki z zestawu (dla SRS i podglądu)
 */
export async function getFlashcardsBySet(req: Request, res: Response) {
  try {
    const setId = Number(req.params.id);
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

/**
 * 🔹 Usuń zestaw + wszystkie fiszki
 */
export async function deleteFlashcardSet(req: Request, res: Response) {
  try {
    const setId = Number(req.params.id);
    if (!setId) return res.status(400).json({ message: "Brak ID zestawu" });

    await prisma.flashcard.deleteMany({ where: { setId } });
    await prisma.flashcardSet.delete({ where: { id: setId } });

    res.json({ message: "✅ Zestaw i jego fiszki zostały usunięte." });
  } catch (err) {
    console.error("❌ Błąd usuwania zestawu:", err);
    res.status(500).json({ message: "Błąd serwera przy usuwaniu zestawu." });
  }
}
