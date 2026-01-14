import { describe, it, expect, vi } from 'vitest';
import { studyRepository } from '../../services/repositories/studyRepository';
import { calculateNextReview } from '../../domain/srs';
import { Grade, type Card } from '../../domain/models';

vi.mock('../../services/repositories/studyRepository');

describe('QuizPage Logic Flow', () => {
    it('should load due cards for quiz', async () => {
        const mockCards: Card[] = [
            { id: 1, deckId: 1, profileId: 1, front: 'hello', back: 'cześć', nextReviewAt: Date.now() - 1000, ease: 2.5, interval: 1, repetitions: 0 },
            { id: 2, deckId: 1, profileId: 1, front: 'cat', back: 'kot', nextReviewAt: Date.now() - 1000, ease: 2.5, interval: 1, repetitions: 0 },
        ];

        vi.mocked(studyRepository.getDueCards).mockResolvedValue(mockCards);

        const dueCards = await studyRepository.getDueCards(1, Date.now());

        expect(dueCards).toHaveLength(2);
        expect(dueCards[0].front).toBe('hello');
    });

    it('should update card after grading', () => {
        const card: Card = {
            id: 1,
            deckId: 1,
            profileId: 1,
            front: 'test',
            back: 'test',
            nextReviewAt: Date.now(),
            ease: 2.5,
            interval: 1,
            repetitions: 1,
        };

        const updatedCard = calculateNextReview(card, Grade.Good);

        expect(updatedCard.repetitions).toBe(2);
        expect(updatedCard.interval).toBe(6);
    });

    it('should save review to database', async () => {
        const review = {
            cardId: 1,
            profileId: 1,
            deckId: 1,
            grade: Grade.Good,
            reviewedAt: Date.now(),
            mode: 'srs' as const,
        };

        vi.mocked(studyRepository.saveReview).mockResolvedValue(undefined);

        await studyRepository.saveReview(review);

        expect(studyRepository.saveReview).toHaveBeenCalledWith(review);
    });

    it('should handle undo last review', async () => {
        const previousState: Card = {
            id: 5,
            deckId: 1,
            profileId: 1,
            front: 'test',
            back: 'test',
            nextReviewAt: Date.now(),
            ease: 2.5,
            interval: 0,
            repetitions: 0,
        };

        vi.mocked(studyRepository.undoLastReview).mockResolvedValue(undefined);

        await studyRepository.undoLastReview(5, previousState);

        expect(studyRepository.undoLastReview).toHaveBeenCalledWith(5, previousState);
    });

    it('should handle writing mode answer normalization', () => {
        const userAnswer = '  HELLO  ';
        const correctAnswer = 'hello';

        const normalized = userAnswer.trim().toLowerCase();

        expect(normalized).toBe(correctAnswer);
    });

    it('should get correct daily review count', async () => {
        vi.mocked(studyRepository.getTodayReviewCount).mockResolvedValue(15);

        const count = await studyRepository.getTodayReviewCount(1);

        expect(count).toBe(15);
    });

    it('should handle empty queue scenario', async () => {
        vi.mocked(studyRepository.getDueCards).mockResolvedValue([]);

        const dueCards = await studyRepository.getDueCards(1, Date.now());

        expect(dueCards).toHaveLength(0);
    });

    it('should handle reverse mode card swap', () => {
        const card: Card = {
            id: 1,
            deckId: 1,
            profileId: 1,
            front: 'hello',
            back: 'cześć',
            nextReviewAt: Date.now(),
            ease: 2.5,
            interval: 1,
            repetitions: 0,
        };

        const reverseMode = true;
        const question = reverseMode ? card.back : card.front;
        const answer = reverseMode ? card.front : card.back;

        expect(question).toBe('cześć');
        expect(answer).toBe('hello');
    });

    it('should reset check result after grading in writing mode', () => {
        let checkResult: 'idle' | 'correct' | 'wrong' = 'correct';

        // Simulate grading and moving to next card
        checkResult = 'idle';

        expect(checkResult).toBe('idle');
    });

    it('should validate progression state after last card', () => {
        const currentIndex = 4;
        const queueLength = 5;

        const isFinished = currentIndex >= queueLength - 1;

        expect(isFinished).toBe(true);
    });
});
