import { describe, it, expect } from 'vitest';
import { calculateNextReview } from './srs';
import { Grade, type Card } from './models';

describe('SRS Algorithm - calculateNextReview', () => {
    const createCard = (overrides: Partial<Card> = {}): Card => ({
        id: 1,
        deckId: 1,
        profileId: 1,
        front: 'test',
        back: 'test',
        nextReviewAt: Date.now(),
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        ...overrides,
    });

    describe('Failure scenarios', () => {
        it('should reset progress when grade is Again (0)', () => {
            const card = createCard({ repetitions: 5, interval: 10, ease: 2.5 });

            const result = calculateNextReview(card, Grade.Again);

            expect(result.repetitions).toBe(0);
            expect(result.interval).toBe(1);
        });
    });

    describe('Success scenarios', () => {
        it('should set interval to 1 for first successful repetition', () => {
            const card = createCard({ repetitions: 0 });

            const result = calculateNextReview(card, Grade.Good);

            expect(result.repetitions).toBe(1);
            expect(result.interval).toBe(1);
        });

        it('should set interval to 6 for second successful repetition', () => {
            const card = createCard({ repetitions: 1, interval: 1 });

            const result = calculateNextReview(card, Grade.Good);

            expect(result.repetitions).toBe(2);
            expect(result.interval).toBe(6);
        });

        it('should multiply interval by ease factor for third+ repetition', () => {
            const card = createCard({ repetitions: 2, interval: 6, ease: 2.5 });

            const result = calculateNextReview(card, Grade.Good);

            expect(result.repetitions).toBe(3);
            expect(result.interval).toBe(Math.round(6 * 2.5));
        });

        it('should increase ease factor on successful review', () => {
            const card = createCard({ ease: 2.5 });

            const result = calculateNextReview(card, Grade.Good);

            expect(result.ease).toBeGreaterThan(2.5);
        });

        it('should enforce minimum ease factor of 1.3', () => {
            const card = createCard({ ease: 1.4, repetitions: 2, interval: 5 });

            const result = calculateNextReview(card, Grade.Hard);

            expect(result.ease).toBeGreaterThanOrEqual(1.3);
        });
    });

    describe('Edge cases', () => {
        it('should handle very large ease values', () => {
            const card = createCard({ ease: 10.0, repetitions: 3, interval: 100 });

            const result = calculateNextReview(card, Grade.Good);

            expect(result.interval).toBe(Math.round(100 * 10.0));
            expect(result.repetitions).toBe(4);
        });

        it('should maintain nextReviewAt as future timestamp', () => {
            const now = Date.now();
            const card = createCard({ repetitions: 1, interval: 1 });

            const result = calculateNextReview(card, Grade.Good);

            expect(result.nextReviewAt).toBeGreaterThan(now);
        });

        it('should handle zero interval after failure', () => {
            const card = createCard({ repetitions: 10, interval: 30, ease: 3.0 });

            const result = calculateNextReview(card, Grade.Again);

            expect(result.interval).toBe(1);
            expect(result.repetitions).toBe(0);
        });
    });
});
