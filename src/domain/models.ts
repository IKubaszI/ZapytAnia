export type Card = {
  id: string;
  front: string; // np. "house"
  back: string;  // np. "dom"
  deckId: string;
  nextReviewAt: number; // kiedy pojawi się w SRS
  ease: number;         // współczynnik „łatwości” 1.3–2.5
  interval: number;     // ile dni do następnej powtórki
  repetitions: number;  // ile poprawnych powtórek z rzędu
};

export type Deck = {
  id: string;
  name: string;
  createdAt: number;
};

export type Review = {
  cardId: string;
  ts: number; // timestamp odpowiedzi
  quality: 0 | 1 | 2 | 3 | 4 | 5; // ocena (SM-2)
};

export type UserStats = {
  totalReviews: number;
  correct: number;
  streakDays: number;
  lastReviewDay: string; // YYYY-MM-DD
};
