const API = "http://localhost:3000/api/reviews";
const frontEl = document.getElementById("front");
const backEl = document.getElementById("back");
const buttons = document.querySelectorAll("#buttons button");
let currentCard = null;
let token = localStorage.getItem("token");

// 🔹 Pobieranie fiszki do powtórki
async function loadNextCard() {
  try {
    const res = await fetch(`${API}/next`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const cards = await res.json();

    if (!cards.length) {
      frontEl.textContent = "🎉 Brak fiszek do powtórki!";
      backEl.style.display = "none";
      buttons.forEach((b) => (b.disabled = true));
      return;
    }

    currentCard = cards[0];
    frontEl.textContent = currentCard.front;
    backEl.textContent = currentCard.back;
    backEl.style.display = "none";
  } catch (err) {
    console.error("Błąd pobierania fiszki:", err);
    frontEl.textContent = "❌ Błąd połączenia z serwerem.";
  }
}

// 🔹 Kliknięcie w kartę — pokazuje tłumaczenie
frontEl.addEventListener("click", () => {
  backEl.style.display = "block";
});

// 🔹 Po kliknięciu — wysyła wynik do backendu i ładuje następną fiszkę
buttons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!currentCard) return;
    const grade = parseInt(btn.dataset.grade);

    try {
      await fetch(`${API}/submit`, {
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

      await loadNextCard();
    } catch (err) {
      console.error("Błąd wysyłania oceny:", err);
    }
  });
});

// 🔹 Start
loadNextCard();
