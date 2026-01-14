import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { studyRepository } from '../../../services/repositories/studyRepository';
import { db } from '../../../services/db';
import dayjs from 'dayjs';

describe('Stats Integration Tests', () => {
    const testProfileId = 7777;
    const testDeckId = 6666;

    beforeEach(async () => {
        await db.profiles.add({
            id: testProfileId,
            name: 'Stats Test User',
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        await db.decks.add({
            id: testDeckId,
            name: 'Stats Test Deck',
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

    describe('Streak Calculation Integration', () => {
        it('should calculate streak correctly for 7 consecutive days', async () => {
            // ARRANGE - dodaj karty
            const cardIds = await db.cards.bulkAdd([
                { deckId: testDeckId, profileId: testProfileId, front: 'a', back: 'A', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
                { deckId: testDeckId, profileId: testProfileId, front: 'b', back: 'B', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
            ]);

            // ARRANGE - dodaj recenzje dla ostatnich 7 dni
            const reviews = [];
            for (let i = 0; i < 7; i++) {
                const daysAgo = dayjs().subtract(i, 'day').startOf('day').valueOf();
                reviews.push({
                    cardId: cardIds[0] as number,
                    profileId: testProfileId,
                    deckId: testDeckId,
                    grade: 5,
                    reviewedAt: daysAgo + 3600000, // noon
                    mode: 'srs' as const,
                });
            }
            await db.reviews.bulkAdd(reviews);

            // ACT - pobierz statystyki
            const stats = await studyRepository.getStats(testProfileId);

            // ACT - oblicz streak (logika z StatsPage)
            const activityMap: Record<string, number> = {};
            stats.forEach(r => {
                const dateKey = dayjs(r.reviewedAt).format('YYYY-MM-DD');
                activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
            });

            const today = dayjs().format('YYYY-MM-DD');
            const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
            let currentStreak = 0;

            if (activityMap[today] || activityMap[yesterday]) {
                let checkDate = dayjs();
                if (!activityMap[today]) {
                    checkDate = checkDate.subtract(1, 'day');
                }
                while (activityMap[checkDate.format('YYYY-MM-DD')] > 0) {
                    currentStreak++;
                    checkDate = checkDate.subtract(1, 'day');
                }
            }

            // ASSERT - check streak
            expect(stats).toHaveLength(7);
            expect(currentStreak).toBe(7);
            expect(Object.keys(activityMap)).toHaveLength(7);
        });

        it('should calculate achievements correctly', async () => {
            // ARRANGE - dodaj karty
            const cardIds = await db.cards.bulkAdd([
                { deckId: testDeckId, profileId: testProfileId, front: 'a', back: 'A', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
                { deckId: testDeckId, profileId: testProfileId, front: 'b', back: 'B', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
            ]);

            // ARRANGE 
            const reviews = [];
            for (let i = 0; i < 50; i++) {
                reviews.push({
                    cardId: cardIds[i % 2] as number,
                    profileId: testProfileId,
                    deckId: testDeckId,
                    grade: i < 30 ? 5 : 0, // Pierwsze 30 poprawne
                    reviewedAt: Date.now() - (50 - i) * 1000,
                    mode: 'srs' as const,
                });
            }
            await db.reviews.bulkAdd(reviews);

            // ACT - pobierz statystyki
            const stats = await studyRepository.getStats(testProfileId);

            // ACT - oblicz metryki
            const total = stats.length;
            const correct = stats.filter(r => r.grade >= 3).length;
            const accuracy = Math.round((correct / total) * 100);

            // ASSERT - check achievements
            expect(total).toBe(50);
            expect(correct).toBe(30);
            expect(accuracy).toBe(60);

            // Achievements logic
            const firstStepUnlocked = total >= 1;
            const veteranUnlocked = total >= 50;
            const perfectionistUnlocked = correct >= 50;

            expect(firstStepUnlocked).toBe(true);
            expect(veteranUnlocked).toBe(true);
            expect(perfectionistUnlocked).toBe(false); // Only 30 correct, need 50
        });
    });

    describe('Backup and Restore Integration', () => {
        it('should successfully backup and restore complete profile data', async () => {
            // ARRANGE - Create complete profile with decks, cards, and reviews
            const cardsData = [
                { front: 'backup1', back: 'test1' },
                { front: 'backup2', back: 'test2' },
            ];
            await studyRepository.importCardsSmart(testDeckId, testProfileId, cardsData);
            const cards = await studyRepository.getCardsForDeck(testDeckId);

            // Add some reviews
            await studyRepository.saveReview({
                cardId: cards[0].id!,
                profileId: testProfileId,
                deckId: testDeckId,
                grade: 5,
                reviewedAt: Date.now(),
                mode: 'srs',
            });

            // ACT - Export data
            const profile = await db.profiles.get(testProfileId);
            const decks = await db.decks.where({ profileId: testProfileId }).toArray();
            const allCards = await db.cards.where({ profileId: testProfileId }).toArray();
            const reviews = await db.reviews.where({ profileId: testProfileId }).toArray();

            const backup = {
                profile,
                decks,
                cards: allCards,
                reviews,
            };

            // ACT - Clear data
            await db.reviews.where({ profileId: testProfileId }).delete();
            await db.cards.where({ profileId: testProfileId }).delete();
            await db.decks.where({ profileId: testProfileId }).delete();

            // ACT - Restore from backup
            await db.decks.bulkAdd(backup.decks);
            await db.cards.bulkAdd(backup.cards);
            await db.reviews.bulkAdd(backup.reviews);

            // ASSERT - Verify restoration
            const restoredDecks = await db.decks.where({ profileId: testProfileId }).toArray();
            const restoredCards = await db.cards.where({ profileId: testProfileId }).toArray();
            const restoredReviews = await db.reviews.where({ profileId: testProfileId }).toArray();

            expect(restoredDecks).toHaveLength(1);
            expect(restoredCards).toHaveLength(2);
            expect(restoredReviews).toHaveLength(1);
        });
    });

    describe('Multi-Deck Statistics Aggregation', () => {
        it('should correctly aggregate statistics across multiple decks', async () => {
            // ARRANGE - Create second deck
            const testDeckId2 = 5555;
            await db.decks.add({
                id: testDeckId2,
                name: 'Second Test Deck',
                profileId: testProfileId,
                createdAt: Date.now(),
            });

            // ARRANGE - Add cards to both decks
            const deck1Cards = await db.cards.bulkAdd([
                { deckId: testDeckId, profileId: testProfileId, front: 'd1c1', back: 'D1C1', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
                { deckId: testDeckId, profileId: testProfileId, front: 'd1c2', back: 'D1C2', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
            ]);

            const deck2Cards = await db.cards.bulkAdd([
                { deckId: testDeckId2, profileId: testProfileId, front: 'd2c1', back: 'D2C1', nextReviewAt: Date.now(), ease: 2.5, interval: 1, repetitions: 0 },
            ]);

            // ACT - Add reviews to both decks
            await db.reviews.bulkAdd([
                { cardId: deck1Cards[0] as number, profileId: testProfileId, deckId: testDeckId, grade: 5, reviewedAt: Date.now(), mode: 'srs' as const },
                { cardId: deck1Cards[1] as number, profileId: testProfileId, deckId: testDeckId, grade: 3, reviewedAt: Date.now(), mode: 'srs' as const },
                { cardId: deck2Cards[0] as number, profileId: testProfileId, deckId: testDeckId2, grade: 5, reviewedAt: Date.now(), mode: 'training' as const },
            ]);

            // ACT - Get aggregated stats
            const allStats = await studyRepository.getStats(testProfileId);
            const todayCount = await studyRepository.getTodayReviewCount(testProfileId);

            // ASSERT
            expect(allStats).toHaveLength(3); // Reviews from both decks
            expect(todayCount).toBe(3); // Total reviews today from all decks

            // Verify mix of modes
            const srsReviews = allStats.filter(r => r.mode === 'srs');
            const trainingReviews = allStats.filter(r => r.mode === 'training');
            expect(srsReviews).toHaveLength(2);
            expect(trainingReviews).toHaveLength(1);

            // Cleanup second deck
            await db.decks.delete(testDeckId2);
        });
    });
});
