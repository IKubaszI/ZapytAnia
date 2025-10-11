import { useEffect, useState } from "react";
import { db } from "../../data/db";
import { updateSRS } from "../../domain/srs";

type Card = {
  id: string;
  front: string;
  back: string;
  deckId: string;
  nextReviewAt: number;
  ease: number;
  interval: number;
  repetitions: number;
};

export default function QuizPage() {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [message, setMessage] = useState("");

  // 🔹 odczytaj id zestawu z parametru URL (np. /quiz?deck=123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deck = params.get("deck");
    if (deck) setDeckId(deck);
  }, []);

  // 🔹 pobierz fiszki do nauki
  useEffect(() => {
    if (!deckId) return;

    async function loadCards() {
      const now = Date.now();
      const dueCards = await db.cards
        .where("deckId")
        .equals(deckId)
        .and((c) => c.nextReviewAt <= now)
        .toArray();

      setCards(dueCards);
      setCurrent(dueCards[0] || null);
    }

    loadCards();
  }, [deckId]);

  if (!deckId) {
    return <p>❌ Brak wybranego zestawu. Wróć i kliknij „Start quiz”.</p>;
  }

  if (!current) {
    return <p>🎉 Brak fiszek do powtórki – wszystko nauczone!</p>;
  }

  // 🔹 obsługa kliknięcia "Pokaż odpowiedź"
  function handleShow() {
    setShowBack(true);
  }

  // 🔹 obsługa oceny odpowiedzi
  async function handleReview(quality: 0 | 3 | 5) {
    if (!current) return;

    const result = updateSRS({
      ease: current.ease,
      interval: current.interval,
      repetitions: current.repetitions,
      quality,
    });

    const nextReviewAt = Date.now() + result.interval * 24 * 60 * 60 * 1000;

    await db.cards.update(current.id, {
      ease: result.ease,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewAt,
    });

    // zapisz do historii powtórek
    await db.reviews.add({
      ts: Date.now(),
      cardId: current.id,
      quality,
    });

    setMessage(
      quality === 5
        ? "✅ Super!"
        : quality === 3
        ? "👌 Nieźle, ale powtórzysz szybciej."
        : "❌ Spróbuj ponownie jutro."
    );

    // usuń kartę z listy i pokaż następną
    const remaining = cards.filter((c) => c.id !== current.id);
    setCards(remaining);
    setCurrent(remaining[0] || null);
    setShowBack(false);
  }

  return (
    <main style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
      <h1>Quiz</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
        }}
      >
        <h2>{current.front}</h2>

        {showBack && (
          <p style={{ fontSize: "1.5rem", marginTop: 20 }}>{current.back}</p>
        )}

        {!showBack ? (
          <button
            onClick={handleShow}
            style={{
              marginTop: 20,
              padding: "8px 16px",
              border: "none",
              background: "#00796b",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Pokaż odpowiedź
          </button>
        ) : (
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => handleReview(0)}
              style={{ background: "#d9534f", color: "white", padding: "6px 12px", border: "none", borderRadius: 6 }}
            >
              Nie pamiętam
            </button>
            <button
              onClick={() => handleReview(3)}
              style={{ background: "#f0ad4e", color: "white", padding: "6px 12px", border: "none", borderRadius: 6 }}
            >
              Trudne
            </button>
            <button
              onClick={() => handleReview(5)}
              style={{ background: "#5cb85c", color: "white", padding: "6px 12px", border: "none", borderRadius: 6 }}
            >
              Łatwe
            </button>
          </div>
        )}
      </div>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
