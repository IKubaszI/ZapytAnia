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

window.db = db;
