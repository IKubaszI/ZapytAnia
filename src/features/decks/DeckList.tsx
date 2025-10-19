import { useEffect, useState } from "react";
import { db, getDeckProgress } from "../../data/db";

type DeckWithCount = {
  id: string;
  name: string;
  count: number;
  progress: number;
};

export default function DeckList({ onDelete }: { onDelete?: () => void }) {
  const [decks, setDecks] = useState<DeckWithCount[]>([]);

  async function loadDecks() {
    const allDecks = await db.decks.toArray();
    const deckData: DeckWithCount[] = [];

    for (const deck of allDecks) {
      const count = await db.cards.where("deckId").equals(deck.id).count();
      const progress = await getDeckProgress(deck.id); // 👈 nowa funkcja
      deckData.push({ id: deck.id, name: deck.name, count, progress });
    }

    setDecks(deckData);
  }

  useEffect(() => {
    loadDecks();
  }, []);

  if (decks.length === 0) {
    return <p>Brak zestawów. Zaimportuj pierwszy plik .txt 👇</p>;
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Twoje zestawy</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {decks.map((deck) => (
          <li
            key={deck.id}
            style={{
              border: "1px solid #ddd",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{deck.name}</strong> <br />
              <small>{deck.count} słówek</small>
              <div
                style={{
                  marginTop: 6,
                  height: 6,
                  background: "#eee",
                  borderRadius: 4,
                  width: 150,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${deck.progress}%`,
                    background:
                      deck.progress > 70 ? "#5cb85c" : "#f0ad4e",
                    borderRadius: 4,
                    transition: "width .3s ease",
                  }}
                />
              </div>
              <small>{deck.progress}% opanowania</small>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  background: "#00796b",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
                onClick={() =>
                  (window.location.href = `/quiz?deck=${deck.id}`)
                }
              >
                Start quiz
              </button>

              <button
                style={{
                  background: "#d9534f",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
                onClick={async () => {
                  if (confirm(`Usunąć zestaw "${deck.name}"?`)) {
                    await db.cards.where("deckId").equals(deck.id).delete();
                    await db.decks.delete(deck.id);
                    onDelete?.();
                    loadDecks(); // 👈 odśwież po usunięciu
                  }
                }}
              >
                Usuń
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
