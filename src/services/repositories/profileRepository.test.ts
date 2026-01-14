import { describe, it, expect, afterEach } from 'vitest';
import { profileRepository } from './profileRepository';
import { studyRepository } from './studyRepository';
import { db } from '../db';

describe('profileRepository Integration Tests', () => {
    afterEach(async () => {
        await db.profiles.clear();
        await db.decks.clear();
        await db.cards.clear();
        await db.reviews.clear();
    });

    describe('create', () => {
        it('should throw error for duplicate profile name (case-insensitive)', async () => {
            await profileRepository.create('TestUser');

            await expect(profileRepository.create('testuser')).rejects.toThrow('PROFILE_EXISTS');
        });
    });

    describe('Export/Import Full Profile', () => {
        it('should export and import complete profile data', async () => {
            // ARRANGE - create profile with data
            const profileId = await profileRepository.create('Export Test User');
            const deckId = await db.decks.add({
                name: 'Test Deck',
                profileId: profileId as number,
                createdAt: Date.now(),
            });

            await db.cards.bulkAdd([
                { deckId: deckId as number, profileId: profileId as number, front: 'a', back: 'A', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
                { deckId: deckId as number, profileId: profileId as number, front: 'b', back: 'B', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
            ]);

            const cardIds = await db.cards.where({ deckId: deckId as number }).primaryKeys();
            await db.reviews.add({
                cardId: cardIds[0] as number,
                profileId: profileId as number,
                deckId: deckId as number,
                grade: 5,
                reviewedAt: Date.now(),
                mode: 'srs',
            });

            // ACT - eksportuj dane
            const exportedJSON = await studyRepository.exportProfileData(profileId as number);

            // ARRANGE - delete all data
            await db.reviews.where({ profileId: profileId as number }).delete();
            await db.cards.where({ profileId: profileId as number }).delete();
            await db.decks.where({ profileId: profileId as number }).delete();

            // ACT - importuj z powrotem
            await studyRepository.importProfileData(exportedJSON);

            // ASSERT - check integrity
            const restoredProfile = await db.profiles.get(profileId as number);
            const restoredDecks = await db.decks.where({ profileId: profileId as number }).toArray();
            const restoredCards = await db.cards.where({ profileId: profileId as number }).toArray();
            const restoredReviews = await db.reviews.where({ profileId: profileId as number }).toArray();

            expect(restoredProfile?.name).toBe('Export Test User');
            expect(restoredDecks).toHaveLength(1);
            expect(restoredCards).toHaveLength(2);
            expect(restoredReviews).toHaveLength(1);
        });
    });

    describe('Profile Switching and Data Isolation', () => {
        it('should isolate data between profiles', async () => {
            // ARRANGE - create 2 profiles with data
            const profile1Id = await profileRepository.create('User 1');
            const profile2Id = await profileRepository.create('User 2');

            const deck1Id = await db.decks.add({
                name: 'Profile 1 Deck',
                profileId: profile1Id as number,
                createdAt: Date.now(),
            });

            const deck2Id = await db.decks.add({
                name: 'Profile 2 Deck',
                profileId: profile2Id as number,
                createdAt: Date.now(),
            });

            await db.cards.add({
                deckId: deck1Id as number,
                profileId: profile1Id as number,
                front: 'p1_card',
                back: 'P1',
                nextReviewAt: Date.now(),
                ease: 2.5,
                interval: 1,
                repetitions: 0,
            });

            await db.cards.add({
                deckId: deck2Id as number,
                profileId: profile2Id as number,
                front: 'p2_card',
                back: 'P2',
                nextReviewAt: Date.now(),
                ease: 2.5,
                interval: 1,
                repetitions: 0,
            });

            // ACT - get data for each profile
            const profile1Decks = await db.decks.where({ profileId: profile1Id as number }).toArray();
            const profile2Decks = await db.decks.where({ profileId: profile2Id as number }).toArray();

            const profile1Cards = await db.cards.where({ profileId: profile1Id as number }).toArray();
            const profile2Cards = await db.cards.where({ profileId: profile2Id as number }).toArray();

            // ASSERT - check isolation
            expect(profile1Decks).toHaveLength(1);
            expect(profile1Decks[0].name).toBe('Profile 1 Deck');

            expect(profile2Decks).toHaveLength(1);
            expect(profile2Decks[0].name).toBe('Profile 2 Deck');

            expect(profile1Cards[0].front).toBe('p1_card');
            expect(profile2Cards[0].front).toBe('p2_card');

            // Profile 1 nie widzi danych Profile 2
            expect(profile1Cards.find(c => c.front === 'p2_card')).toBeUndefined();
            expect(profile2Cards.find(c => c.front === 'p1_card')).toBeUndefined();
        });
    });
});
