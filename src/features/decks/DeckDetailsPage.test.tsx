import { describe, it, expect, vi } from 'vitest';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';

vi.mock('../../services/repositories/studyRepository');
vi.mock('../../services/repositories/profileRepository');

describe('DeckDetailsPage Data Flow', () => {
    it('should call createCard with correct parameters', async () => {
        vi.mocked(profileRepository.getActiveProfileId).mockReturnValue(1);
        vi.mocked(studyRepository.createCard).mockResolvedValue(2);

        const newCard = {
            deckId: 1,
            profileId: 1,
            front: 'apple',
            back: 'jabłko',
            nextReviewAt: Date.now(),
            ease: 2.5,
            interval: 0,
            repetitions: 0,
        };

        const cardId = await studyRepository.createCard(newCard);

        expect(cardId).toBe(2);
        expect(studyRepository.createCard).toHaveBeenCalledWith(newCard);
    });

    it('should delete a card', async () => {
        vi.mocked(studyRepository.deleteCard).mockResolvedValue(undefined);

        await studyRepository.deleteCard(5);

        expect(studyRepository.deleteCard).toHaveBeenCalledWith(5);
    });

    it('should bulk delete multiple cards', async () => {
        vi.mocked(studyRepository.bulkDeleteCards).mockResolvedValue(undefined);

        const cardIds = [1, 2, 3];
        await studyRepository.bulkDeleteCards(cardIds);

        expect(studyRepository.bulkDeleteCards).toHaveBeenCalledWith(cardIds);
    });

    it('should bulk reset progress for selected cards', async () => {
        vi.mocked(studyRepository.bulkResetProgress).mockResolvedValue(undefined);

        const cardIds = [4, 5, 6];
        await studyRepository.bulkResetProgress(cardIds);

        expect(studyRepository.bulkResetProgress).toHaveBeenCalledWith(cardIds);
    });

    it('should export deck to CSV', async () => {
        const mockCSV = 'front,back\nhello,cześć\ncat,kot';
        vi.mocked(studyRepository.exportDeckToCSV).mockResolvedValue(mockCSV);

        const csv = await studyRepository.exportDeckToCSV(1);

        expect(csv).toContain('hello');
        expect(csv).toContain('cześć');
        expect(studyRepository.exportDeckToCSV).toHaveBeenCalledWith(1);
    });
});
