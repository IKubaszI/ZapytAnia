import { db } from '../db';
import type { Profile } from '../../domain/models';

const CURRENT_PROFILE_KEY = 'zapytania.currentProfileId';

export const profileRepository = {
  getAll: async () => db.profiles.orderBy('lastUsedAt').reverse().toArray(),
  
  getById: async (id: number) => db.profiles.get(id),
  
  create: async (name: string, avatarUrl?: string) => {
    // 1. Walidacja unikalności nazwy (case-insensitive)
    const existing = await db.profiles
      .filter(p => p.name.toLowerCase() === name.trim().toLowerCase())
      .first();

    if (existing) {
      throw new Error("PROFILE_EXISTS");
    }

    const id = await db.profiles.add({
      name: name.trim(),
      avatarUrl,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    });
    return id;
  },

  update: async (id: number, changes: Partial<Profile>) => {
    if (changes.name) {
      const existing = await db.profiles
        .filter(p => p.name.toLowerCase() === changes.name!.trim().toLowerCase() && p.id !== id)
        .first();
      
      if (existing) {
        throw new Error("PROFILE_EXISTS");
      }
    }
    await db.profiles.update(id, changes);
  },

  delete: async (id: number) => {
    return db.transaction('rw', db.profiles, db.decks, db.cards, db.reviews, async () => {
      await db.reviews.where({ profileId: id }).delete();
      await db.cards.where({ profileId: id }).delete();
      await db.decks.where({ profileId: id }).delete();
      await db.profiles.delete(id);
    });
  },

  getActiveProfileId: (): number | null => {
    const stored = localStorage.getItem(CURRENT_PROFILE_KEY);
    return stored ? parseInt(stored, 10) : null;
  },

  setActiveProfileId: async (id: number) => {
    localStorage.setItem(CURRENT_PROFILE_KEY, id.toString());
    await db.profiles.update(id, { lastUsedAt: Date.now() });
  }
};