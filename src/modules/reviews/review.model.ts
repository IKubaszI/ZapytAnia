import prisma from "../../lib/prisma";

/**
 * 🔹 Pobiera fiszki do powtórki (dla danego użytkownika i zestawu)
 * Zwraca tylko te, które mają termin powtórki <= teraz (nextReviewAt),
 * lub które nie mają jeszcze żadnej powtórki.
 */
export async function getDueCards(userId: number, setId: number) {
  try {
    // Pobierz fiszki z zestawu wraz z ostatnią powtórką
    const cards = await prisma.flashcard.findMany({
      where: { setId },
      include: {
        reviews: {
          where: { userId },
          orderBy: { reviewedAt: "desc" },
          take: 1,
        },
      },
    });

    const now = new Date();

    // 🔹 Fiszki, które są do powtórki
    const due = cards.filter((card) => {
      const last = card.reviews[0];
      if (!last) return true; // nowa fiszka bez historii
      return new Date(last.nextReviewAt) <= now;
    });

    return due.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      setId: c.setId,
    }));
  } catch (err) {
    console.error("❌ Błąd getDueCards:", err);
    return [];
  }
}

/**
 * 🔹 Zapisuje wynik powtórki i aktualizuje harmonogram SRS (SuperMemo 2)
 */
export async function submitReview(userId: number, cardId: number, grade: number) {
  try {
    const now = new Date();

    // 🔹 Pobierz poprzedni wpis (jeśli istnieje)
    const prev = await prisma.review.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });

    // 🔹 Domyślne wartości dla nowej fiszki
    let easiness = 2.5;
    let interval = 1;
    let repetition = 1;

    if (prev) {
      // 🔸 Oblicz nową łatwość (E-Factor)
      const q = grade; // ocena użytkownika (0–5)
      const newEasiness = prev.easiness + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
      easiness = Math.max(1.3, newEasiness); // min 1.3
      repetition = q < 3 ? 1 : prev.repetition + 1;

      if (repetition === 1) interval = 1;
      else if (repetition === 2) interval = 6;
      else interval = Math.round(prev.interval * easiness);
    }

    // 🔹 Wylicz następny termin powtórki
    const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    // 🔹 Zaktualizuj lub utwórz wpis review
    const review = await prisma.review.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: {
        userId,
        cardId,
        grade,
        easiness,
        interval,
        repetition,
        reviewedAt: now,
        nextReviewAt,
      },
      update: {
        grade,
        easiness,
        interval,
        repetition,
        reviewedAt: now,
        nextReviewAt,
      },
    });

    return review;
  } catch (err) {
    console.error("❌ Błąd submitReview:", err);
    throw err;
  }
}

/**
 * 🔹 Tworzy puste wpisy Review dla wszystkich fiszek z zestawu,
 * jeśli użytkownik ich jeszcze nie ma.
 * Dzięki temu algorytm SRS działa od razu po imporcie zestawu.
 */
export async function ensureReviewsForSet(userId: number, setId: number) {
  try {
    const cards = await prisma.flashcard.findMany({
      where: { setId },
      select: { id: true },
    });

    for (const card of cards) {
      const exists = await prisma.review.findUnique({
        where: { userId_cardId: { userId, cardId: card.id } },
      });

      if (!exists) {
        await prisma.review.create({
          data: {
            userId,
            cardId: card.id,
            grade: 0,
            interval: 1,
            repetition: 0,
            easiness: 2.5,
            reviewedAt: new Date(0), // bardzo stara data (czyli "nigdy nie uczone")
            nextReviewAt: new Date(), // gotowe do nauki od razu
          },
        });
      }
    }

    console.log(`✅ ensureReviewsForSet: dodano wpisy Review dla zestawu ${setId}`);
  } catch (err) {
    console.error("❌ Błąd ensureReviewsForSet:", err);
  }
}
