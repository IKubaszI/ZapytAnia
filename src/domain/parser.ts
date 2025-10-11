/**
 * Zamienia zawartość pliku .txt w tablicę obiektów {front, back}.
 * Każda linia ma format: front=back
 */
export function parseTxt(txt: string) {
  return txt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [front, back] = line.split("=").map((s) => s.trim());
      if (!front || !back) return null;
      return { front, back };
    })
    .filter((x): x is { front: string; back: string } => x !== null);
}
