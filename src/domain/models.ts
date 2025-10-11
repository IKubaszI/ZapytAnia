// src/domain/models.ts
export type Card = {
  id: string;
  front: string;
  back: string;
  deckId: string;
  nextReviewAt: number;
  ease: number;
  interval: number;
  repetitions: number;
};

export type Deck = {
  id: string;
  name: string;
  createdAt: number;
};

export type Review = {
  cardId: string;
  ts: number;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
};

export type UserStats = {
  totalReviews: number;
  correct: number;
  streakDays: number;
  lastReviewDay: string;
};
