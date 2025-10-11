import Dexie, { Table } from "dexie";
import { Card, Deck, Review, UserStats } from "../domain/models";

export class ZapytaniaDB extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  reviews!: Table<Review, number>;
  stats!: Table<UserStats, string>;

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
