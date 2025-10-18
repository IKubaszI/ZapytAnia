const urlParams = new URLSearchParams(window.location.search);
const setId = urlParams.get("set");
const token = localStorage.getItem("token");

const frontEl = document.getElementById("front");
const backEl = document.getElementById("back");
const checkBtn = document.getElementById("checkBtn");
const gradeButtons = document.getElementById("buttons");
const buttons = document.querySelectorAll("#buttons button");

let cards = [];
let currentIndex = 0;

// 🔹 Ładowanie fiszek do powtórki (tylko te na dziś)
async function loadCards() {
  try {
    console.log("👉 Ładuję fiszki do powtórki dla setId:", setId);

    const res = await fetch(`/api/reviews/due?setId=${setId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      frontEl.textContent = "❌ Błąd pobierania fiszek.";
      console.error(await res.text());
      return;
    }

    cards = await res.json();
    console.log("📦 Otrzymane fiszki do powtórki:", cards);

    if (!cards.length) {
      frontEl.textContent = "🎉 Wszystkie fiszki są powtórzone na dziś!";
      backEl.textContent = "";
      checkBtn.style.display = "none";
      gradeButtons.style.display = "none";
      return;
    }

    showCard();
  } catch (err) {
    console.error("❌ Błąd połączenia:", err);
    frontEl.textContent = "❌ Nie udało się załadować fiszek.";
  }
}

// 🔹 Pokazanie fiszki
function showCard() {
  const card = cards[currentIndex];
  frontEl.textContent = card.front || "(brak tekstu)";
  backEl.textContent = card.back || "";
  backEl.style.display = "none";
  gradeButtons.style.display = "none";
  checkBtn.style.display = "inline-block";
}

// 🔹 Klik „Sprawdź” — pokaż tłumaczenie
checkBtn.addEventListener("click", () => {
  backEl.style.display = "block";
  gradeButtons.style.display = "flex";
  checkBtn.style.display = "none";
});

// 🔹 Klik oceny (❌ / 😐 / ✅)
buttons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const grade = parseInt(btn.dataset.grade);
    const card = cards[currentIndex];

    console.log(`📘 ${card.front} → ocena ${grade}`);

    // 🔸 Wyślij ocenę do backendu
    try {
      await fetch("/api/reviews/submit", {
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

    // 🔸 Następna karta
    currentIndex++;
    if (currentIndex < cards.length) showCard();
    else {
  frontEl.textContent = "🎉 Powtórka zakończona!";
  backEl.textContent = "";
  gradeButtons.style.display = "none";
  checkBtn.style.display = "none";

  // 🔹 Zapis do historii lokalnej
  const setName = new URLSearchParams(window.location.search).get("setName") || "Zestaw";
  const setId = new URLSearchParams(window.location.search).get("set");
  const progress = Math.floor(Math.random() * 30 + 70); // przykładowe % (docelowo można pobrać z /api/reviews/stats)

  let history = JSON.parse(localStorage.getItem("historySets") || "[]");
  const existing = history.find((h) => h.setId === setId);

  if (existing) {
    existing.progress = progress;
  } else {
    history.push({ setId, name: setName, progress });
  }

  localStorage.setItem("historySets", JSON.stringify(history));

  // 🔹 Powrót po chwili
  setTimeout(() => {
    window.location.href = "/dashboard.html";
  }, 1500);
}


  });
});

// 🔹 Start
loadCards();
