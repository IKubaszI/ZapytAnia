import { describe, it, expect } from "vitest";
import { parseTxt } from "./parser";

describe("parseTxt", () => {
  it("parsuje poprawne linie 'front=back'", () => {
    const input = "house=dom\ncar=samochód\n";
    const result = parseTxt(input);
    expect(result).toEqual([
      { front: "house", back: "dom" },
      { front: "car", back: "samochód" },
    ]);
  });

  it("ignoruje puste linie i błędne formaty", () => {
    const input = "apple=jabłko\nniepoprawna\n\ncar=samochód";
    const result = parseTxt(input);
    expect(result.length).toBe(2);
  });
});
