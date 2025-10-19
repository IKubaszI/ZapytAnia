// ====== KONFIGURACJA ======
const API = "http://localhost:3000/api";
const params = new URLSearchParams(window.location.search);
const setId = params.get("set");
const mode = params.get("mode") || "srs";

const frontEl = document.getElementById("front");
const backEl = document.getElementById("back");
const buttons = document.querySelectorAll("#buttons button");

let currentCard = null;
let cardsQueue = [];
let token = localStorage.getItem("token");

// ====== POBIERZ FISZKI ======
async function loadCards() {
  if (!setId) {
    frontEl.textContent = "❌ Brak ID zestawu w adresie URL.";
    return;
  }

  try {
    let res;
    if (mode === "all") {
      // 🧠 pełny trening — wszystkie fiszki zestawu
      res = await fetch(`${API}/flashcards/set/${setId}`);
    } else {
      // 🔁 tryb SRS — tylko do powtórki
      res = await fetch(`${API}/reviews/due?setId=${setId}`);
    }

    if (!res.ok) throw new Error(`Błąd HTTP ${res.status}`);
    cardsQueue = await res.json();

    if (!cardsQueue.length) {
      frontEl.textContent = "🎉 Brak fiszek do nauki!";
      backEl.style.display = "none";
      buttons.forEach((b) => (b.disabled = true));
      return;
    }

    nextCard();
  } catch (err) {
    console.error("❌ Błąd ładowania fiszek:", err);
    frontEl.textContent = "❌ Nie udało się pobrać fiszek.";
  }
}

// ====== POKAŻ KOLEJNĄ FISZKĘ ======
function nextCard() {
  if (cardsQueue.length === 0) {
    frontEl.textContent = "🏁 Koniec sesji!";
    backEl.style.display = "none";
    buttons.forEach((b) => (b.disabled = true));
    return;
  }

  currentCard = cardsQueue.shift();
  frontEl.textContent = currentCard.front;
  backEl.textContent = currentCard.back;
  backEl.style.display = "none";
}

// ====== POKAŻ TŁUMACZENIE ======
frontEl.addEventListener("click", () => {
  backEl.style.display = "block";
});

// ====== OCENIANIE (tylko SRS) ======
buttons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!currentCard) return;
    const grade = parseInt(btn.dataset.grade);

    // 🧠 tryb pełny – nie zapisujemy ocen
    if (mode === "all") {
      nextCard();
      return;
    }

    // 🔁 tryb SRS – zapisujemy powtórkę
    try {
      await fetch(`${API}/reviews/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardId: currentCard.id,
          grade,
        }),
      });
      nextCard();
    } catch (err) {
      console.error("❌ Błąd wysyłania oceny:", err);
    }
  });
});

// ====== START ======
document.addEventListener("DOMContentLoaded", loadCards);
