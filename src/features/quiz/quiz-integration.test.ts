import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { studyRepository } from '../../services/repositories/studyRepository';
import { calculateNextReview } from '../../domain/srs';
import { Grade } from '../../domain/models';
import { db } from '../../services/db';

describe('Quiz Integration Tests', () => {
    const testProfileId = 9999;
    const testDeckId = 8888;

    beforeEach(async () => {
        await db.profiles.add({
            id: testProfileId,
            name: 'Integration Test User',
            createdAt: Date.now(),
            lastUsedAt: Date.now()
        });
        await db.decks.add({
            id: testDeckId,
            name: 'Integration Test Deck',
            profileId: testProfileId,
            createdAt: Date.now()
        });
    });

    afterEach(async () => {
        await db.reviews.where({ profileId: testProfileId }).delete();
        await db.cards.where({ profileId: testProfileId }).delete();
        await db.decks.where({ profileId: testProfileId }).delete();
        await db.profiles.delete(testProfileId);
    });

    describe('Full Quiz Flow', () => {
        it('should complete full user journey from deck creation to stats', async () => {
            // ARRANGE - stwórz karty
            const cardsData = [
                { front: 'hello', back: 'cześć' },
                { front: 'cat', back: 'kot' },
                { front: 'dog', back: 'pies' },
            ];

            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);

            // ACT - pobierz karty do quizu
            const dueCards = await studyRepository.getDueCards(testDeckId, Date.now());

            expect(dueCards).toHaveLength(3);

            // ACT - oceń pierwszą kartę jako Good
            const card1 = dueCards[0];
            const updatedCard1 = calculateNextReview(card1, Grade.Good);
            await studyRepository.updateCard(updatedCard1);
            await studyRepository.saveReview({
                cardId: card1.id!,
                profileId: testProfileId,
                deckId: testDeckId,
                grade: Grade.Good,
                reviewedAt: Date.now(),
                mode: 'srs',
            });

            // ACT - oceń drugą kartę jako Again
            const card2 = dueCards[1];
            const updatedCard2 = calculateNextReview(card2, Grade.Again);
            await studyRepository.updateCard(updatedCard2);
            await studyRepository.saveReview({
                cardId: card2.id!,
                profileId: testProfileId,
                deckId: testDeckId,
                grade: Grade.Again,
                reviewedAt: Date.now(),
                mode: 'srs',
            });

            // ASSERT - sprawdź statystyki
            const stats = await studyRepository.getStats(testProfileId);
            expect(stats).toHaveLength(2);

            const todayCount = await studyRepository.getTodayReviewCount(testProfileId);
            expect(todayCount).toBe(2);

            // ASSERT - sprawdź stan kart
            const card1Updated = await db.cards.get(card1.id);
            expect(card1Updated?.repetitions).toBe(1);
            expect(card1Updated?.interval).toBe(1);

            const card2Updated = await db.cards.get(card2.id);
            expect(card2Updated?.repetitions).toBe(0);
            expect(card2Updated?.interval).toBe(1);
        });
    });

    describe('Quiz Mode Switching', () => {
        it('should handle different quiz modes correctly', async () => {
            // ARRANGE
            const cardsData = [
                { front: 'a', back: 'A' },
                { front: 'b', back: 'B' },
                { front: 'c', back: 'C' },
            ];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);

            // Mark some cards as reviewed (not due anymore)
            const allCards = await studyRepository.getCardsForDeck(testDeckId);
            const futureTime = Date.now() + 86400000 * 7; // 7 days in future
            await db.cards.update(allCards[0].id!, { nextReviewAt: futureTime });

            // ACT - SRS mode (only due cards)
            const dueCards = await studyRepository.getDueCards(testDeckId, Date.now());

            // ACT - ALL mode (all cards)
            const allCardsInDeck = await studyRepository.getCardsForDeck(testDeckId);

            // ASSERT
            expect(dueCards).toHaveLength(2); // Only cards 2 and 3 are due
            expect(allCardsInDeck).toHaveLength(3); // All cards returned
        });
    });
});
