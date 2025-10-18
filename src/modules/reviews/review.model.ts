import prisma from "../../lib/prisma";

/**
 * 🔹 SuperMemo 2 algorithm – oblicz kolejną powtórkę
 */
function sm2Calc(params: {
  prevRepetition: number;
  prevInterval: number;
  prevEasiness: number;
  grade: number;
}) {
  let { prevRepetition: n, prevInterval: I, prevEasiness: EF, grade: q } = params;

  // 📘 Zasady SM-2
  if (q < 3) {
    n = 0;
    I = 1;
  } else {
    n++;
    if (n === 1) I = 1;
    else if (n === 2) I = 6;
    else I = Math.round(I * EF);
  }

  // 📘 Nowy współczynnik trudności
  EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (EF < 1.3) EF = 1.3;

  // 📘 Nowy termin powtórki
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + Math.max(1, I));

  return { repetition: n, interval: I, easiness: EF, nextReviewAt };
}

/**
 * 🔹 Upewnij się, że Review istnieje (tworzy jeśli nie)
 */
export async function ensureReview(userId: number, cardId: number) {
  const existing = await prisma.review.findUnique({
    where: { userId_cardId: { userId, cardId } },
  });

  if (existing) return existing;

  const now = new Date();

  return prisma.review.create({
    data: {
      userId,
      cardId,
      grade: 0,
      interval: 1,
      repetition: 0,
      easiness: 2.5,
      nextReviewAt: now,
      reviewedAt: now,
    },
  });
}

/**
 * 🔹 Tworzy brakujące rekordy Review dla całego zestawu
 */
export async function ensureReviewsForSet(userId: number, setId: number) {
  const cards = await prisma.flashcard.findMany({
    where: { setId },
    select: { id: true },
  });

  if (!cards.length) return;

  const now = new Date();

  await prisma.$transaction(
    cards.map((card) =>
      prisma.review.upsert({
        where: { userId_cardId: { userId, cardId: card.id } },
        create: {
          userId,
          cardId: card.id,
          grade: 0,
          interval: 1,
          repetition: 0,
          easiness: 2.5,
          nextReviewAt: now,
          reviewedAt: now,
        },
        update: {}, // jeśli istnieje, nie zmieniaj
      })
    )
  );
}

/**
 * 🔹 Pobierz fiszki do powtórki (na dziś)
 */
export async function getDueCards(userId: number, setId: number, take = 20) {
  await ensureReviewsForSet(userId, setId);

  const now = new Date();

  const dueReviews = await prisma.review.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      card: { setId },
    },
    include: { card: true },
    orderBy: { nextReviewAt: "asc" },
    take,
  });

  if (dueReviews.length > 0) {
    return dueReviews.map((r: any) => r.card);
  }

  return prisma.flashcard.findMany({
    where: { setId },
    take,
    orderBy: { id: "asc" },
  });
}

/**
 * 🔹 Zapisz ocenę użytkownika i przelicz SRS
 */
export async function submitReview(userId: number, cardId: number, grade: number) {
  const prev = await ensureReview(userId, cardId);

  const { repetition, interval, easiness, nextReviewAt } = sm2Calc({
    prevRepetition: prev.repetition,
    prevInterval: prev.interval,
    prevEasiness: prev.easiness,
    grade,
  });

  return prisma.review.update({
    where: { userId_cardId: { userId, cardId } },
    data: {
      grade,
      repetition,
      interval,
      easiness,
      nextReviewAt,
      reviewedAt: new Date(),
    },
  });
}
