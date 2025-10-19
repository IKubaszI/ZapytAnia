import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { submitReview as submitReviewModel, getDueCards } from "./review.model";

/**
 * 🔹 Pobierz fiszki do powtórki (na dziś – tryb SRS)
 */
export async function getDueReviews(req: Request, res: Response) {
  try {
    const userId = 11; // tymczasowy użytkownik testowy
    const setId = Number(req.query.setId);

    if (!setId) {
      return res.status(400).json({ message: "Brak setId" });
    }

    const dueCards = await getDueCards(userId, setId);
    res.json(dueCards);
  } catch (error) {
    console.error("❌ Błąd pobierania fiszek do powtórki:", error);
    res.status(500).json({ message: "Błąd serwera przy pobieraniu powtórek" });
  }
}

/**
 * 🔹 Zapisz wynik powtórki (aktualizacja w Review)
 */
export async function submitReview(req: Request, res: Response) {
  try {
    const userId = 11; // tymczasowy użytkownik testowy
    const { cardId, grade } = req.body;

    if (!cardId || grade === undefined) {
      return res.status(400).json({ message: "Brak danych: cardId lub grade" });
    }

    const updated = await submitReviewModel(userId, cardId, grade);
    res.json(updated);
  } catch (error) {
    console.error("❌ Błąd zapisu powtórki:", error);
    res.status(500).json({ message: "Błąd zapisu wyniku powtórki" });
  }
}

/**
 * 🔹 Statystyki nauki użytkownika (dla wykresów i % opanowania)
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 11; // testowy użytkownik

    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { reviewedAt: "asc" },
    });

    if (!reviews.length) {
      res.json({
        totalReviews: 0,
        correctRate: 0,
        streak: 0,
        chartData: [],
      });
      return;
    }

    const totalReviews = reviews.length;

    // 🔹 grupujemy oceny po cardId
    const groupedByCard = new Map<number, number[]>();
    for (const r of reviews) {
      if (!groupedByCard.has(r.cardId)) groupedByCard.set(r.cardId, []);
      groupedByCard.get(r.cardId)!.push(r.grade);
    }

    // 🔹 karta "opanowana" = min. 2 powtórki i średnia ocena ≥ 4
    let masteredCount = 0;
    for (const [, grades] of groupedByCard) {
      if (grades.length >= 2) {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        if (avg >= 4) masteredCount++;
      }
    }

    const totalCards = groupedByCard.size;
    const correctRate =
      totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

    // 🔹 liczba dni aktywnej nauki (streak)
    const uniqueDays = new Set(
      reviews.map((r) => new Date(r.reviewedAt).toDateString())
    );
    const streak = uniqueDays.size;

    // 🔹 dane do wykresu (dzień → liczba powtórek)
    const grouped: Record<string, number> = {};
    for (const r of reviews) {
      const day = new Date(r.reviewedAt).toLocaleDateString("pl-PL");
      grouped[day] = (grouped[day] || 0) + 1;
    }

    const chartData = Object.entries(grouped).map(([day, count]) => ({
      day,
      count,
    }));

    res.json({
      totalReviews,
      correctRate,
      streak,
      chartData,
    });
  } catch (error) {
    console.error("❌ Błąd generowania statystyk:", error);
    res.status(500).json({ message: "Błąd serwera przy generowaniu statystyk" });
  }
};

/**
 * 🔹 Historia nauki użytkownika – widoczna w panelu
 * Sortowana od najnowszej powtórki.
 */
export async function getLearningHistory(req: Request, res: Response) {
  try {
    const userId = 11; // tymczasowy użytkownik testowy

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: { card: { include: { set: true } } },
      orderBy: { reviewedAt: "desc" },
    });

    if (!reviews.length) return res.json([]);

    // Grupujemy po zestawach, biorąc najnowszy wpis
    const historyMap = new Map<number, any>();
    for (const r of reviews) {
      const setId = r.card.set.id;
      if (!historyMap.has(setId)) {
        const minutesAgo = Math.floor(
          (Date.now() - new Date(r.reviewedAt).getTime()) / 60000
        );
        historyMap.set(setId, {
          setId,
          setName: r.card.set.name,
          lastReview: r.reviewedAt,
          minutesAgo,
          mastery: Math.min(Math.round(r.easiness * 20), 100), // przeliczenie easiness (0–5) na %
        });
      }
    }

    // Sortuj po czasie — najnowsze na górze
    const historyArray = [...historyMap.values()].sort(
      (a, b) => a.minutesAgo - b.minutesAgo
    );

    res.json(historyArray);
  } catch (error) {
    console.error("❌ Błąd historii nauki:", error);
    res.status(500).json({ message: "Błąd serwera przy historii nauki" });
  }
}
