import { describe, it, expect, afterEach } from 'vitest';
import { profileRepository } from '../../services/repositories/profileRepository';
import { studyRepository } from '../../services/repositories/studyRepository';
import { db } from '../../services/db';

describe('Profile Integration Tests', () => {
    const testProfileId1 = 2222;
    const testProfileId2 = 1111;

    afterEach(async () => {
        // Cleanup all test data
        await db.reviews.where({ profileId: testProfileId1 }).delete();
        await db.cards.where({ profileId: testProfileId1 }).delete();
        await db.decks.where({ profileId: testProfileId1 }).delete();
        await db.profiles.delete(testProfileId1);

        await db.reviews.where({ profileId: testProfileId2 }).delete();
        await db.cards.where({ profileId: testProfileId2 }).delete();
        await db.decks.where({ profileId: testProfileId2 }).delete();
        await db.profiles.delete(testProfileId2);
    });

    describe('Profile Creation Flow', () => {
        it('should create new profile and make it active with empty state', async () => {
            // ARRANGE - No profile exists
            const profileName = 'New Test User';

            // ACT - Create profile
            const profileId = await profileRepository.create(profileName);
            expect(profileId).toBeDefined();

            // ACT - Set as active
            await profileRepository.setActiveProfileId(profileId);

            // ASSERT - Verify profile was created
            const profile = await db.profiles.get(profileId);
            expect(profile).toBeDefined();
            expect(profile?.name).toBe(profileName);
            expect(profile?.createdAt).toBeDefined();

            // ASSERT - Verify it's active
            const activeProfileId = profileRepository.getActiveProfileId();
            expect(activeProfileId).toBe(profileId);

            // ASSERT - Verify empty state (no decks, cards, reviews)
            const decks = await db.decks.where({ profileId }).toArray();
            const cards = await db.cards.where({ profileId }).toArray();
            const reviews = await db.reviews.where({ profileId }).toArray();

            expect(decks).toHaveLength(0);
            expect(cards).toHaveLength(0);
            expect(reviews).toHaveLength(0);

            // ASSERT - Verify stats are empty
            const stats = await studyRepository.getStats(profileId);
            const todayCount = await studyRepository.getTodayReviewCount(profileId);

            expect(stats).toHaveLength(0);
            expect(todayCount).toBe(0);
        });
    });

    describe('Profile Switching Flow', () => {
        it('should switch between profiles with complete data isolation', async () => {
            // ARRANGE - Create two profiles with different data
            const profile1Name = 'User One';
            const profile2Name = 'User Two';

            const profileId1 = await profileRepository.create(profile1Name);
            const profileId2 = await profileRepository.create(profile2Name);

            // Create deck and cards for Profile 1
            const deck1Id = await db.decks.add({
                name: 'Profile 1 Deck',
                profileId: profileId1,
                createdAt: Date.now(),
            });

            await studyRepository.importCardsSmart(deck1Id, profileId1, [
                { front: 'hello', back: 'cześć' },
                { front: 'cat', back: 'kot' },
            ]);

            // Add review for Profile 1
            const cards1 = await studyRepository.getCardsForDeck(deck1Id);
            await studyRepository.saveReview({
                cardId: cards1[0].id!,
                profileId: profileId1,
                deckId: deck1Id,
                grade: 5,
                reviewedAt: Date.now(),
                mode: 'srs',
            });

            // Create deck and cards for Profile 2
            const deck2Id = await db.decks.add({
                name: 'Profile 2 Deck',
                profileId: profileId2,
                createdAt: Date.now(),
            });

            await studyRepository.importCardsSmart(deck2Id, profileId2, [
                { front: 'dog', back: 'pies' },
            ]);

            // ACT - Switch to Profile 1
            await profileRepository.setActiveProfileId(profileId1);

            // ASSERT - Verify Profile 1 data
            let activeId = profileRepository.getActiveProfileId();
            expect(activeId).toBe(profileId1);

            const decks1 = await studyRepository.getDecks(profileId1);
            const cards1All = await db.cards.where({ profileId: profileId1 }).toArray();
            const stats1 = await studyRepository.getStats(profileId1);

            expect(decks1).toHaveLength(1);
            expect(decks1[0].name).toBe('Profile 1 Deck');
            expect(cards1All).toHaveLength(2);
            expect(stats1).toHaveLength(1);

            // ACT - Switch to Profile 2
            await profileRepository.setActiveProfileId(profileId2);

            // ASSERT - Verify Profile 2 data (different from Profile 1)
            activeId = profileRepository.getActiveProfileId();
            expect(activeId).toBe(profileId2);

            const decks2 = await studyRepository.getDecks(profileId2);
            const cards2All = await db.cards.where({ profileId: profileId2 }).toArray();
            const stats2 = await studyRepository.getStats(profileId2);

            expect(decks2).toHaveLength(1);
            expect(decks2[0].name).toBe('Profile 2 Deck');
            expect(cards2All).toHaveLength(1);
            expect(stats2).toHaveLength(0); // No reviews for Profile 2

            // ASSERT - Verify data isolation (Profile 1 data still intact)
            const deck1Still = await db.decks.get(deck1Id);
            expect(deck1Still).toBeDefined();
            expect(deck1Still?.profileId).toBe(profileId1);

            // ASSERT - Verify no cross-contamination
            const profile1Cards = await db.cards.where({ profileId: profileId1 }).toArray();
            const profile2Cards = await db.cards.where({ profileId: profileId2 }).toArray();

            expect(profile1Cards.every(c => c.profileId === profileId1)).toBe(true);
            expect(profile2Cards.every(c => c.profileId === profileId2)).toBe(true);
        });
    });
});
