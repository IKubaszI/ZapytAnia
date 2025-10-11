import { useEffect, useState } from "react";
import { db } from "../../data/db";

type DeckWithCount = {
  id: string;
  name: string;
  count: number;
};

export default function DeckList({ onDelete }: { onDelete?: () => void }) {
  const [decks, setDecks] = useState<DeckWithCount[]>([]);

  async function loadDecks() {
    const allDecks = await db.decks.toArray();
    const deckData: DeckWithCount[] = [];

    for (const deck of allDecks) {
      const count = await db.cards.where("deckId").equals(deck.id).count();
      deckData.push({
        id: deck.id,
        name: deck.name,
        count,
      });
    }

    setDecks(deckData);
  }

  useEffect(() => {
    loadDecks();
  }, []);

  // 🧹 odśwież, gdy rodzic zmieni klucz (props)
  useEffect(() => {
    loadDecks();
  }, [onDelete]);

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
               onClick={() => {
  window.location.href = `/quiz?deck=${deck.id}`;
}}

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
                    onDelete?.(); //  odśwież listę po usunięciu
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
