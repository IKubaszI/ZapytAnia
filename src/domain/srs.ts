import { Grade } from './models';
import type { Card } from './models';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const calculateNextReview = (card: Card, grade: number): Card => {
  const now = Date.now();
  let { ease, interval, repetitions } = card;

  if (grade < Grade.Hard) {
    // Porażka: resetujemy postęp
    repetitions = 0;
    interval = 1;
  } else {
    // Sukces
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (ease < 1.3) ease = 1.3;
  }

  return {
    ...card,
    ease,
    interval,
    repetitions,
    nextReviewAt: now + (interval * ONE_DAY_MS),
  };
};