export interface Profile {
  id?: number;
  name: string;
  avatarUrl?: string;
  createdAt: number;
  lastUsedAt: number;
}

export interface Deck {
  id?: number;
  name: string;
  createdAt: number;
  profileId: number;
  cardCount?: number;
}

export interface Card {
  id?: number;
  deckId: number;
  profileId: number;
  front: string;
  back: string;
  nextReviewAt: number;
  ease: number;
  interval: number;
  repetitions: number;
}

export interface Review {
  id?: number;
  cardId: number;
  profileId: number;
  deckId: number;
  grade: number;
  reviewedAt: number;
  mode: 'srs' | 'training';
}

export const Grade = {
  Again: 0,
  Hard: 3,
  Good: 5,
} as const;

// Typ pomocniczy
export type GradeType = typeof Grade[keyof typeof Grade];