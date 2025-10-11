import { useState } from "react";
import { parseTxt } from "../../domain/parser";
import { db } from "../../data/db";
import { nanoid } from "nanoid";

export default function ImportBox() {
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const pairs = parseTxt(text);
    if (pairs.length === 0) {
      setMessage("❌ Nie znaleziono poprawnych wpisów w pliku.");
      return;
    }

    // Tworzymy nowy zestaw (deck)
    const deckId = nanoid();
    const deckName = file.name.replace(/\.[^/.]+$/, ""); // bez rozszerzenia

    await db.transaction("rw", db.decks, db.cards, async () => {
      await db.decks.add({
        id: deckId,
        name: deckName,
        createdAt: Date.now(),
      });

      for (const { front, back } of pairs) {
        await db.cards.add({
          id: nanoid(),
          deckId,
          front,
          back,
          nextReviewAt: Date.now(),
          ease: 2.5,
          interval: 0,
          repetitions: 0,
        });
      }
    });

    setMessage(`✅ Zaimportowano ${pairs.length} słówek do zestawu "${deckName}".`);
    e.target.value = ""; // reset inputu
  }

  return (
    <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h2>Importuj zestaw słówek (.txt)</h2>
      <p>Każda linia powinna mieć format <code>ang=pol</code></p>
      <input type="file" accept=".txt" onChange={handleFile} />
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </section>
  );
}
