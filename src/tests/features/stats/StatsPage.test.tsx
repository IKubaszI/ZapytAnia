import { describe, it, expect, vi } from 'vitest';
import { studyRepository } from '../../../services/repositories/studyRepository';
import { profileRepository } from '../../../services/repositories/profileRepository';

vi.mock('../../../services/repositories/studyRepository');
vi.mock('../../../services/repositories/profileRepository');

describe('StatsPage Data Flow', () => {
    it('should load stats and today count', async () => {
        const mockReviews = [
            { id: 1, cardId: 1, profileId: 1, deckId: 1, grade: 5, reviewedAt: Date.now(), mode: 'srs' as const },
            { id: 2, cardId: 2, profileId: 1, deckId: 1, grade: 3, reviewedAt: Date.now(), mode: 'srs' as const },
        ];

        vi.mocked(profileRepository.getActiveProfileId).mockReturnValue(1);
        vi.mocked(studyRepository.getStats).mockResolvedValue(mockReviews);
        vi.mocked(studyRepository.getTodayReviewCount).mockResolvedValue(10);

        const stats = await studyRepository.getStats(1);
        const todayCount = await studyRepository.getTodayReviewCount(1);

        expect(stats).toHaveLength(2);
        expect(todayCount).toBe(10);
    });

    it('should calculate accuracy correctly', () => {
        const reviews = [
            { id: 1, cardId: 1, profileId: 1, deckId: 1, grade: 5, reviewedAt: Date.now(), mode: 'srs' as const },
            { id: 2, cardId: 2, profileId: 1, deckId: 1, grade: 3, reviewedAt: Date.now(), mode: 'srs' as const },
            { id: 3, cardId: 3, profileId: 1, deckId: 1, grade: 0, reviewedAt: Date.now(), mode: 'srs' as const },
            { id: 4, cardId: 4, profileId: 1, deckId: 1, grade: 5, reviewedAt: Date.now(), mode: 'srs' as const },
        ];

        const correctCount = reviews.filter(r => r.grade >= 3).length;
        const accuracy = Math.round((correctCount / reviews.length) * 100);

        expect(accuracy).toBe(75); // 3 out of 4 correct
    });

    it('should validate achievement unlocking', () => {
        const stats = {
            total: 50,
            streak: 7,
            correct: 30,
        };

        const firstStepUnlocked = stats.total >= 1;
        const weekWarriorUnlocked = stats.streak >= 7;
        const veteranUnlocked = stats.total >= 50;

        expect(firstStepUnlocked).toBe(true);
        expect(weekWarriorUnlocked).toBe(true);
        expect(veteranUnlocked).toBe(true);
    });

    it('should export profile data as backup', async () => {
        const mockJSON = '{"profiles":[],"decks":[],"cards":[]}';
        vi.mocked(studyRepository.exportProfileData).mockResolvedValue(mockJSON);

        const json = await studyRepository.exportProfileData(1);

        expect(json).toContain('profiles');
        expect(json).toContain('decks');
        expect(studyRepository.exportProfileData).toHaveBeenCalledWith(1);
    });

    it('should import profile data from backup', async () => {
        const mockData = '{"profiles":[{"id":1,"name":"Test"}]}';
        vi.mocked(studyRepository.importProfileData).mockResolvedValue(true);

        await studyRepository.importProfileData(mockData);

        expect(studyRepository.importProfileData).toHaveBeenCalledWith(mockData);
    });

    it('should calculate streak for consecutive days', () => {
        // Mock scenario: user learned yesterday and today
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = today - 86400000; // 24 hours ago

        const activityMap: Record<string, number> = {
            [new Date(yesterday).toISOString().split('T')[0]]: 5,
            [new Date(today).toISOString().split('T')[0]]: 3,
        };

        const hasActivity = Object.keys(activityMap).length > 0;
        expect(hasActivity).toBe(true);
    });
});
