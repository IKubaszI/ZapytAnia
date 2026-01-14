import { describe, it, expect, vi } from 'vitest';
import { studyRepository } from '../../../services/repositories/studyRepository';
import { profileRepository } from '../../../services/repositories/profileRepository';

vi.mock('../../../services/repositories/studyRepository');
vi.mock('../../../services/repositories/profileRepository');

describe('DecksPage Data Flow', () => {
    it('should call getDecks with active profile ID', async () => {
        const mockDecks = [
            { id: 1, name: 'English', profileId: 1, createdAt: Date.now(), cardCount: 10, learnedCount: 5 },
        ];

        vi.mocked(profileRepository.getActiveProfileId).mockReturnValue(1);
        vi.mocked(studyRepository.getDecks).mockResolvedValue(mockDecks);

        const profileId = profileRepository.getActiveProfileId();
        const decks = await studyRepository.getDecks(profileId);

        expect(profileId).toBe(1);
        expect(decks).toEqual(mockDecks);
        expect(decks[0].name).toBe('English');
    });

    it('should import cards to deck', async () => {
        const cardsData = [
            { front: 'cat', back: 'kot' },
            { front: 'dog', back: 'pies' },
        ];

        vi.mocked(studyRepository.importCardsSmart).mockResolvedValue(2);

        const imported = await studyRepository.importCardsSmart(1, 1, cardsData);

        expect(imported).toBe(2);
        expect(studyRepository.importCardsSmart).toHaveBeenCalledWith(1, 1, cardsData);
    });

    it('should find existing deck by name for merge', async () => {
        const mockDeck = { id: 1, name: 'English', profileId: 1, createdAt: Date.now() };
        vi.mocked(studyRepository.findDeckByName).mockResolvedValue(mockDeck);

        const found = await studyRepository.findDeckByName(1, 'English');

        expect(found).toEqual(mockDeck);
        expect(studyRepository.findDeckByName).toHaveBeenCalledWith(1, 'English');
    });

    it('should create new deck', async () => {
        vi.mocked(studyRepository.createDeck).mockResolvedValue(5);

        const deckId = await studyRepository.createDeck(1, 'New Deck');

        expect(deckId).toBe(5);
        expect(studyRepository.createDeck).toHaveBeenCalledWith(1, 'New Deck');
    });

    it('should delete deck', async () => {
        vi.mocked(studyRepository.deleteDeck).mockResolvedValue(undefined);

        await studyRepository.deleteDeck(3);

        expect(studyRepository.deleteDeck).toHaveBeenCalledWith(3);
    });

    it('should create empty deck without cards', async () => {
        vi.mocked(studyRepository.createDeck).mockResolvedValue(7);

        const deckId = await studyRepository.createDeck(1, 'Empty Deck');

        expect(deckId).toBe(7);
        expect(studyRepository.createDeck).toHaveBeenCalledWith(1, 'Empty Deck');
    });
});
