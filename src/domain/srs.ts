// src/domain/srs.ts
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Implementacja prostego algorytmu SuperMemo 2 (SM2)
 * Zwraca zaktualizowany ease, interval i repetitions.
 */
export function updateSRS({
  ease,
  interval,
  repetitions,
  quality,
}: {
  ease: number;
  interval: number;
  repetitions: number;
  quality: ReviewQuality;
}) {
  if (quality < 3) {
    return {
      ease,
      repetitions: 0,
      interval: 1,
    };
  }

  const newEase = Math.max(1.3, ease + 0.1 - (5 - quality) * 0.08);
  const newReps = repetitions + 1;

  let newInterval = 1;
  if (newReps === 1) newInterval = 1;
  else if (newReps === 2) newInterval = 6;
  else newInterval = Math.round(interval * newEase);

  return {
    ease: newEase,
    repetitions: newReps,
    interval: newInterval,
  };
}
