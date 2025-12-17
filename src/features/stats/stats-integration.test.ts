import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { studyRepository } from '../../services/repositories/studyRepository';
import { db } from '../../services/db';
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

            // ASSERT - sprawdź streak
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

            // ARRANGE - dodaj 50 recenzji (30 poprawnych, 20 błędnych)
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

            // ASSERT - sprawdź osiągnięcia
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
});
