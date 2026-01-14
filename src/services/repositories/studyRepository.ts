import { db } from '../db';
import type { Card, Review } from '../../domain/models';

const ensureProfile = (profileId: number | null) => {
  if (!profileId) throw new Error("No active profile");
  return profileId;
};

export const studyRepository = {
  getDecks: async (profileId: number | null) => {
    const pid = ensureProfile(profileId);
    const decks = await db.decks.where({ profileId: pid }).toArray();
    const decksWithStats = await Promise.all(decks.map(async (d) => {
      const total = await db.cards.where({ deckId: d.id }).count();
      const learned = await db.cards.where({ deckId: d.id }).filter(c => c.repetitions > 0).count();
      return { ...d, cardCount: total, learnedCount: learned };
    }));
    return decksWithStats;
  },

  findDeckByName: async (profileId: number | null, name: string) => {
    const pid = ensureProfile(profileId);
    return db.decks.where({ profileId: pid }).filter(d => d.name.toLowerCase() === name.toLowerCase()).first();
  },

  createDeck: async (profileId: number | null, name: string) => {
    const pid = ensureProfile(profileId);
    return db.decks.add({ name, profileId: pid, createdAt: Date.now() });
  },

  deleteDeck: async (deckId: number) => {
    return db.transaction('rw', db.cards, db.decks, db.reviews, async () => {
      await db.reviews.where({ deckId }).delete();
      await db.cards.where({ deckId }).delete();
      await db.decks.delete(deckId);
    });
  },

  importCardsSmart: async (deckId: number, profileId: number, cardsData: {front: string, back: string}[]) => {
    const existingCards = await db.cards.where({ deckId }).toArray();
    const existingSet = new Set(existingCards.map(c => `${c.front.trim().toLowerCase()}|${c.back.trim().toLowerCase()}`));
    const newCards = cardsData.filter(item => {
        const signature = `${item.front.trim().toLowerCase()}|${item.back.trim().toLowerCase()}`;
        return !existingSet.has(signature);
    });
    if (newCards.length === 0) return 0;
    await db.cards.bulkAdd(newCards.map(item => ({
        deckId, profileId, front: item.front.trim(), back: item.back.trim(),
        nextReviewAt: Date.now(), ease: 2.5, interval: 0, repetitions: 0
    })));
    return newCards.length;
  },

  getCardsForDeck: async (deckId: number) => db.cards.where({ deckId }).toArray(),
  getDueCards: async (deckId: number, now: number) => db.cards.where({ deckId }).filter(c => c.nextReviewAt <= now).toArray(),
  createCard: async (card: Omit<Card, 'id'>) => db.cards.add(card),
  updateCard: async (card: Card) => { if(card.id) return db.cards.put(card); },
  deleteCard: async (id: number) => db.cards.delete(id),
  saveReview: async (review: Review) => db.reviews.add(review),
  
  getStats: async (profileId: number | null) => { 
      const pid = ensureProfile(profileId); 
      return db.reviews.where({ profileId: pid }).toArray(); 
  },

  getTodayReviewCount: async (profileId: number) => {
    const pid = ensureProfile(profileId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return db.reviews.where({ profileId: pid }).filter(r => r.reviewedAt >= startOfDay.getTime()).count();
  },

  undoLastReview: async (cardId: number, previousState: Card) => {
    return db.transaction('rw', db.cards, db.reviews, async () => {
        await db.cards.put(previousState);
        const lastReview = await db.reviews.where({ cardId }).reverse().first();
        if (lastReview?.id) await db.reviews.delete(lastReview.id);
    });
  },

  bulkDeleteCards: async (cardIds: number[]) => { await db.cards.bulkDelete(cardIds); },
  
  bulkResetProgress: async (cardIds: number[]) => {
      const cards = await db.cards.bulkGet(cardIds);
      const validCards = cards.filter(c => c !== undefined) as Card[];
      const resetCards = validCards.map(c => ({ ...c, repetitions: 0, interval: 0, ease: 2.5, nextReviewAt: Date.now() }));
      await db.cards.bulkPut(resetCards);
  },

  exportDeckToCSV: async (deckId: number) => {
      const cards = await db.cards.where({ deckId }).toArray();
      let csvContent = "Front,Back\n";
      cards.forEach(c => {
          const front = c.front.replace(/"/g, '""');
          const back = c.back.replace(/"/g, '""');
          csvContent += `"${front}","${back}"\n`;
      });
      return csvContent;
  },

  exportProfileData: async (profileId: number) => {
    const pid = ensureProfile(profileId);
    const decks = await db.decks.where({ profileId: pid }).toArray();
    const cards = await db.cards.where({ profileId: pid }).toArray();
    const reviews = await db.reviews.where({ profileId: pid }).toArray();
    const profile = await db.profiles.get(pid);
    const data = { version: 1, timestamp: Date.now(), profile, decks, cards, reviews };
    return JSON.stringify(data, null, 2);
  },

  importProfileData: async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.profile || !Array.isArray(data.decks)) throw new Error("Zły format");
      await db.transaction('rw', db.profiles, db.decks, db.cards, db.reviews, async () => {
        const pid = data.profile.id;
        await db.reviews.where({ profileId: pid }).delete();
        await db.cards.where({ profileId: pid }).delete();
        await db.decks.where({ profileId: pid }).delete();
        await db.profiles.put(data.profile);
        await db.decks.bulkAdd(data.decks);
        await db.cards.bulkAdd(data.cards);
        await db.reviews.bulkAdd(data.reviews);
      });
      return true;
    } catch (e) { throw new Error("Błąd importu"); }
  }
};