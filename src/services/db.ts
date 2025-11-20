import Dexie, { type Table } from 'dexie';
import type { Profile, Deck, Card, Review } from '../domain/models';

class ZapytaniaDB extends Dexie {
  profiles!: Table<Profile>;
  decks!: Table<Deck>;
  cards!: Table<Card>;
  reviews!: Table<Review>;

  constructor() {
    super('ZapytaniaDB_v2');
    this.version(1).stores({
      profiles: '++id, name, lastUsedAt',
      decks: '++id, profileId, name',
      cards: '++id, deckId, profileId, nextReviewAt',
      reviews: '++id, cardId, profileId, deckId, reviewedAt'
    });
  }
}

export const db = new ZapytaniaDB();