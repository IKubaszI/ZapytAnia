import Dexie, { type Table } from 'dexie';
import type { Profile, Deck, Card, Review } from '../domain/models';

class ZapytaniaDB extends Dexie {
  profiles!: Table<Profile>;
  decks!: Table<Deck>;
  cards!: Table<Card>;
  reviews!: Table<Review>;

  constructor() {
    super('ZapytaniaDB_v2');
<<<<<<< HEAD
    this.version(2).stores({
=======
    this.version(1).stores({
>>>>>>> 8d763e573fdbd71622511f4fb50c75526feec3d9
      profiles: '++id, name, lastUsedAt',
      decks: '++id, profileId, name',
      cards: '++id, deckId, profileId, nextReviewAt',
      reviews: '++id, cardId, profileId, deckId, reviewedAt'
    });
  }
}

export const db = new ZapytaniaDB();