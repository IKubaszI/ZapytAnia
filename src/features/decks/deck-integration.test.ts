import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { studyRepository } from '../../services/repositories/studyRepository';
import { db } from '../../services/db';

describe('Deck Integration Tests', () => {
    const testProfileId = 4444;
    const testDeckId = 3333;

    beforeEach(async () => {
        await db.profiles.add({
            id: testProfileId,
            name: 'Deck Test User',
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        await db.decks.add({
            id: testDeckId,
            name: 'Deck Test',
            profileId: testProfileId,
            createdAt: Date.now(),
        });
    });

    afterEach(async () => {
        await db.reviews.where({ profileId: testProfileId }).delete();
        await db.cards.where({ profileId: testProfileId }).delete();
        await db.decks.where({ profileId: testProfileId }).delete();
        await db.profiles.delete(testProfileId);
    });

    describe('Deck Lifecycle Integration', () => {
        it('should handle complete deck lifecycle: create, populate, study, delete', async () => {
            // ARRANGE - Create deck (already done in beforeEach)
            const deckId = testDeckId;

            // ACT - Import cards
            const cardsData = [
                { front: 'lifecycle1', back: 'test1' },
                { front: 'lifecycle2', back: 'test2' },
                { front: 'lifecycle3', back: 'test3' },
            ];
            await studyRepository.importCardsSmart(deckId, testProfileId, cardsData);

            // ACT - Study cards (add reviews)
            const cards = await studyRepository.getCardsForDeck(deckId);
            expect(cards).toHaveLength(3);

            for (const card of cards) {
                await studyRepository.saveReview({
                    cardId: card.id!,
                    profileId: testProfileId,
                    deckId: deckId,
                    grade: 5,
                    reviewedAt: Date.now(),
                    mode: 'srs',
                });
            }

            // Verify reviews were saved
            const stats = await studyRepository.getStats(testProfileId);
            expect(stats).toHaveLength(3);

            // ACT - Delete deck and cascade
            await studyRepository.deleteDeck(deckId);

            // ASSERT - Verify cascade delete
            const remainingCards = await db.cards.where({ deckId: deckId }).toArray();
            const remainingDeck = await db.decks.get(deckId);

            expect(remainingDeck).toBeUndefined();
            expect(remainingCards).toHaveLength(0);
        });
    });

    describe('Smart Import with Duplicate Detection', () => {
        it('should prevent duplicate cards during multiple imports', async () => {
            // ARRANGE - First import
            const firstBatch = [
                { front: 'hello', back: 'cześć' },
                { front: 'cat', back: 'kot' },
            ];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, firstBatch);

            const cardsAfterFirst = await studyRepository.getCardsForDeck(testDeckId);
            expect(cardsAfterFirst).toHaveLength(2);

            // ACT - Second import with duplicates
            const secondBatch = [
                { front: 'hello', back: 'cześć' }, // Duplicate
                { front: 'dog', back: 'pies' },     // New
                { front: 'cat', back: 'kot' },      // Duplicate
            ];
            const importResult = await studyRepository.importCardsSmart(testDeckId, testProfileId, secondBatch);

            // ASSERT - Only new card should be added
            const cardsAfterSecond = await studyRepository.getCardsForDeck(testDeckId);
            expect(cardsAfterSecond).toHaveLength(3); // 2 original + 1 new
            expect(importResult).toBe(1); // Only 1 new card added

            // Verify the new card is present
            const dogCard = cardsAfterSecond.find(c => c.front === 'dog');
            expect(dogCard).toBeDefined();
            expect(dogCard?.back).toBe('pies');

            // Verify duplicates weren't added again
            const helloCards = cardsAfterSecond.filter(c => c.front === 'hello');
            expect(helloCards).toHaveLength(1); // Only one instance
        });
    });
});
