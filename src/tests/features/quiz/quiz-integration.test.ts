import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { studyRepository } from '../../../services/repositories/studyRepository';
import { calculateNextReview } from '../../../domain/srs';
import { Grade } from '../../../domain/models';
import { db } from '../../../services/db';

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
            // ARRANGE - create cards
            const cardsData = [
                { front: 'hello', back: 'cześć' },
                { front: 'cat', back: 'kot' },
                { front: 'dog', back: 'pies' },
            ];

            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);

            // ACT - get cards for quiz
            const dueCards = await studyRepository.getDueCards(testDeckId, Date.now());

            expect(dueCards).toHaveLength(3);

            // ACT - grade first card as Good
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

            // ACT - grade second card as Again
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

            // ASSERT - check statistics
            const stats = await studyRepository.getStats(testProfileId);
            expect(stats).toHaveLength(2);

            const todayCount = await studyRepository.getTodayReviewCount(testProfileId);
            expect(todayCount).toBe(2);

            // ASSERT - check card state
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

    describe('Writing Mode Integration', () => {
        it('should handle complete writing mode journey with answer normalization', async () => {
            // ARRANGE
            const cardsData = [
                { front: 'hello', back: 'cześć' },
                { front: 'goodbye', back: 'do widzenia' },
            ];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);

            const cards = await studyRepository.getCardsForDeck(testDeckId);

            // ACT - simulate user typing answer with extra spaces and wrong case
            const userAnswer = '  CZEŚĆ  ';
            const correctAnswer = cards[0].back;
            const normalized = userAnswer.trim().toLowerCase();
            const isCorrect = normalized === correctAnswer.toLowerCase();

            // Save as correct (Grade.Good)
            if (isCorrect) {
                await studyRepository.saveReview({
                    cardId: cards[0].id!,
                    profileId: testProfileId,
                    deckId: testDeckId,
                    grade: Grade.Good,
                    reviewedAt: Date.now(),
                    mode: 'srs',
                });
            }

            // ASSERT
            expect(isCorrect).toBe(true);
            const stats = await studyRepository.getStats(testProfileId);
            expect(stats).toHaveLength(1);
            expect(stats[0].grade).toBe(Grade.Good);
        });
    });

    describe('Undo Flow Integration', () => {
        it('should properly restore state after undo operation', async () => {
            // ARRANGE
            const cardsData = [{ front: 'test', back: 'test' }];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);
            const cards = await studyRepository.getCardsForDeck(testDeckId);
            const card = cards[0];

            // ACT - Grade card as Good
            const updatedCard = calculateNextReview(card, Grade.Good);
            await studyRepository.updateCard(updatedCard);
            await studyRepository.saveReview({
                cardId: card.id!,
                profileId: testProfileId,
                deckId: testDeckId,
                grade: Grade.Good,
                reviewedAt: Date.now(),
                mode: 'srs',
            });

            // Verify review was saved
            let todayCount = await studyRepository.getTodayReviewCount(testProfileId);
            expect(todayCount).toBe(1);

            // ACT - Undo
            await studyRepository.undoLastReview(card.id!, card);

            // ASSERT - Verify state restored
            todayCount = await studyRepository.getTodayReviewCount(testProfileId);
            expect(todayCount).toBe(0);

            const restoredCard = await db.cards.get(card.id);
            expect(restoredCard?.nextReviewAt).toBe(card.nextReviewAt);
            expect(restoredCard?.interval).toBe(card.interval);
        });
    });

    describe('Reverse Mode Integration', () => {
        it('should swap question and answer in reverse mode throughout full flow', async () => {
            // ARRANGE
            const cardsData = [{ front: 'English', back: 'Polski' }];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);
            const cards = await studyRepository.getCardsForDeck(testDeckId);
            const card = cards[0];

            // ACT - Simulate reverse mode
            const reverseMode = true;
            const question = reverseMode ? card.back : card.front;
            const answer = reverseMode ? card.front : card.back;

            // Verify swap
            expect(question).toBe('Polski');
            expect(answer).toBe('English');

            // Grade in reverse mode
            await studyRepository.saveReview({
                cardId: card.id!,
                profileId: testProfileId,
                deckId: testDeckId,
                grade: Grade.Good,
                reviewedAt: Date.now(),
                mode: 'training',
            });

            // ASSERT
            const stats = await studyRepository.getStats(testProfileId);
            expect(stats).toHaveLength(1);
        });
    });

    describe('Daily Goal Tracking Integration', () => {
        it('should accurately track progress towards daily goal across multiple sessions', async () => {
            // ARRANGE
            const cardsData = [
                { front: '1', back: 'one' },
                { front: '2', back: 'two' },
                { front: '3', back: 'three' },
            ];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);
            const cards = await studyRepository.getCardsForDeck(testDeckId);

            // ACT - Review multiple cards
            for (let i = 0; i < 3; i++) {
                await studyRepository.saveReview({
                    cardId: cards[i].id!,
                    profileId: testProfileId,
                    deckId: testDeckId,
                    grade: Grade.Good,
                    reviewedAt: Date.now(),
                    mode: 'srs',
                });
            }

            // ASSERT
            const todayCount = await studyRepository.getTodayReviewCount(testProfileId);
            expect(todayCount).toBe(3);

            const stats = await studyRepository.getStats(testProfileId);
            expect(stats).toHaveLength(3);

            // Verify daily goal calculation
            const dailyGoal = 20;
            const progress = Math.min(100, Math.round((todayCount / dailyGoal) * 100));
            expect(progress).toBe(15); // 3/20 = 15%
        });
    });
});
