import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { submitReview as submitReviewModel, getDueCards } from "./review.model";

/**
 * 🔹 Pobierz fiszki do powtórki (na dziś)
 */
export async function getDueReviews(req: Request, res: Response) {
  try {
    const userId = 11; // 🔹 Tymczasowy użytkownik gość
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
 * 🔹 Zapisz wynik powtórki
 */
export async function submitReview(req: Request, res: Response) {
  try {
    const userId = 11; // 🔹 Tymczasowy użytkownik gość
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
 * 🔹 Statystyki nauki użytkownika (dla wykresu)
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 11; // 🔹 ten sam testowy użytkownik

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
    const correct = reviews.filter((r) => r.grade >= 4).length;
    const correctRate = Math.round((correct / totalReviews) * 100);

    // 🔹 policz unikalne dni nauki
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

    res.json({ totalReviews, correctRate, streak, chartData });
  } catch (error) {
    console.error("❌ Błąd generowania statystyk:", error);
    res.status(500).json({ message: "Błąd serwera przy generowaniu statystyk" });
  }
};
