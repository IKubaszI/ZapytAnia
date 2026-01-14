import { db } from '../db';
import type { Profile } from '../../domain/models';

const CURRENT_PROFILE_KEY = 'zapytania.currentProfileId';

export const profileRepository = {
  getAll: async () => db.profiles.orderBy('lastUsedAt').reverse().toArray(),
<<<<<<< HEAD

  getById: async (id: number) => db.profiles.get(id),

  create: async (name: string, avatarUrl?: string) => {
    // 1. Walidacja unikalności nazwy (case-insensitive)
    try {
      const existing = await db.profiles
        .filter(p => p.name.toLowerCase() === name.trim().toLowerCase())
        .first();

      if (existing) {
        console.warn(`Profile creation failed: '${name}' already exists.`);
        throw new Error("PROFILE_EXISTS");
      }

      const id = await db.profiles.add({
        name: name.trim(),
        avatarUrl,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      });
      console.log(`Profile '${name}' created successfully with ID: ${id}`);
      return id;
    } catch (error: any) {
      console.error("Dexie error in profileRepository.create:", error);
      if (error && typeof error === 'object') {
        console.error("Dexie Error Details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          inner: error.inner
        });
      }
      throw error;
    }
=======
  
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
>>>>>>> 8d763e573fdbd71622511f4fb50c75526feec3d9
  },

  update: async (id: number, changes: Partial<Profile>) => {
    if (changes.name) {
      const existing = await db.profiles
        .filter(p => p.name.toLowerCase() === changes.name!.trim().toLowerCase() && p.id !== id)
        .first();
<<<<<<< HEAD

=======
      
>>>>>>> 8d763e573fdbd71622511f4fb50c75526feec3d9
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