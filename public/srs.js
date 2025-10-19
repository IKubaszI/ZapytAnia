// ====== KONFIGURACJA ======
const API = "http://localhost:3000/api";
const params = new URLSearchParams(window.location.search);
const setId = params.get("set");
const mode = params.get("mode") || "srs";
const token = localStorage.getItem("token");

// ====== ELEMENTY HTML ======
const frontEl = document.getElementById("front");
const backEl = document.getElementById("back");
const checkBtn = document.getElementById("checkBtn");
const gradeButtons = document.getElementById("buttons");
const buttons = document.querySelectorAll("#buttons button");

let cards = [];
let currentIndex = 0;

// ====== POBIERZ FISZKI ======
async function loadCards() {
  if (!setId) {
    frontEl.textContent = "❌ Brak ID zestawu w adresie URL.";
    return;
  }

  try {
    let res;
    if (mode === "all") {
      console.log("🧠 Tryb pełny — pobieram wszystkie fiszki z zestawu:", setId);
      res = await fetch(`${API}/flashcards/set/${setId}`);
    } else {
      console.log("🔁 Tryb SRS — pobieram fiszki do powtórki dla zestawu:", setId);
      res = await fetch(`${API}/reviews/due?setId=${setId}`);
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cards = await res.json();

    if (!cards.length) {
      frontEl.textContent =
        mode === "all"
          ? "📭 Brak fiszek w zestawie!"
          : "🎉 Wszystkie fiszki są powtórzone na dziś!";
      backEl.textContent = "";
      checkBtn.style.display = "none";
      gradeButtons.style.display = "none";
      return;
    }

    showCard();
  } catch (err) {
    console.error("❌ Błąd ładowania fiszek:", err);
    frontEl.textContent = "❌ Nie udało się załadować fiszek.";
  }
}

// ====== POKAŻ AKTUALNĄ FISZKĘ ======
function showCard() {
  const card = cards[currentIndex];
  if (!card) return;

  frontEl.textContent = card.front || "(brak tekstu)";
  backEl.textContent = card.back || "";
  backEl.style.display = "none";
  gradeButtons.style.display = "none";
  checkBtn.style.display = "inline-block";
}

// ====== KLIK: SPRAWDŹ ======
checkBtn.addEventListener("click", () => {
  backEl.style.display = "block";
  gradeButtons.style.display = "flex";
  checkBtn.style.display = "none";
});

// ====== KLIK: OCENY ======
buttons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const grade = parseInt(btn.dataset.grade);
    const card = cards[currentIndex];

    if (!card) return;

    if (mode === "all") {
      // 🧠 tryb pełny — nie zapisujemy, tylko dalej
      currentIndex++;
      if (currentIndex < cards.length) showCard();
      else finishSession();
      return;
    }

    // 🔁 tryb SRS — zapis oceny
    try {
      await fetch(`${API}/reviews/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardId: card.id,
          grade,
        }),
      });
    } catch (err) {
      console.error("❌ Błąd wysyłania oceny:", err);
    }

    currentIndex++;
    if (currentIndex < cards.length) showCard();
    else finishSession();
  });
});

// ====== ZAKOŃCZENIE SESJI ======
function finishSession() {
  frontEl.textContent =
    mode === "all" ? "🏁 Koniec treningu pełnego!" : "🎉 Powtórka zakończona!";
  backEl.textContent = "";
  gradeButtons.style.display = "none";
  checkBtn.style.display = "none";

  // 🔹 Zapis do lokalnej historii
  const setName =
    new URLSearchParams(window.location.search).get("setName") || "Zestaw";
  const progress =
    mode === "all" ? 0 : Math.floor(Math.random() * 30 + 70); // przykładowy %

  let history = JSON.parse(localStorage.getItem("historySets") || "[]");
  const existing = history.find((h) => h.setId === setId);

  if (existing) {
    existing.progress = progress;
  } else {
    history.push({ setId, name: setName, progress });
  }

  localStorage.setItem("historySets", JSON.stringify(history));

  // 🔹 Automatyczny powrót do panelu po 1.5 sekundy
  setTimeout(() => {
    window.location.href = "/dashboard.html";
  }, 1500);
}

// ====== START ======
document.addEventListener("DOMContentLoaded", loadCards);
