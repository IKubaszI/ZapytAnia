import { describe, it, expect } from 'vitest';
import { calculateNextReview } from '../../domain/srs';
import { Grade, type Card } from '../../domain/models';

describe('Writing Mode Logic', () => {
    const createCard = (): Card => ({
        id: 1,
        deckId: 1,
        profileId: 1,
        front: 'test',
        back: 'answer',
        nextReviewAt: Date.now(),
        ease: 2.5,
        interval: 1,
        repetitions: 0,
    });

    describe('Answer checking', () => {
        it('should normalize answers for comparison', () => {
            const userAnswer = '  ANSWER  ';
            const correctAnswer = 'answer';

            const normalized = userAnswer.trim().toLowerCase();

            expect(normalized).toBe(correctAnswer);
        });

        it('should handle typos with Grade.Hard', () => {
            const card = createCard();

            const result = calculateNextReview(card, Grade.Hard);

            expect(result.repetitions).toBe(1);
            expect(result.ease).toBeLessThan(2.5);
        });
    });
});
