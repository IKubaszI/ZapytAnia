// src/data/db.ts
import Dexie from "dexie";
import type { Card, Deck, Review, UserStats } from "../domain/models";

export class ZapytaniaDB extends Dexie {
  decks!: Dexie.Table<Deck, string>;
  cards!: Dexie.Table<Card, string>;
  reviews!: Dexie.Table<Review, number>;
  stats!: Dexie.Table<UserStats, string>;

  constructor() {
    super("ZapytaniaDB");
    this.version(1).stores({
      decks: "id, name, createdAt",
      cards: "id, deckId, nextReviewAt",
      reviews: "++ts, cardId",
      stats: "lastReviewDay",
    });
  }
}

export const db = new ZapytaniaDB();

// ─────────────────────────────────────────────
// 🔹 Progres zestawu — ile % fiszek opanowanych
// ─────────────────────────────────────────────

const MIN_REPS_FOR_LEARNED = 2;  // min. 2 powtórki
const MIN_INTERVAL_DAYS = 6;     // min. 6 dni

export async function getDeckProgress(deckId: string) {
  const cards = await db.cards.where("deckId").equals(deckId).toArray();
  const total = cards.length;
  if (total === 0) return 0;

  const now = Date.now();

  const learned = cards.filter(
    (c) =>
      c.repetitions >= MIN_REPS_FOR_LEARNED &&
      c.interval >= MIN_INTERVAL_DAYS &&
      c.nextReviewAt > now
  ).length;

  return Math.round((learned / total) * 100);
}
