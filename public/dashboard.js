// 🔹 Lista przykładowych zestawów
const sets = [
  { id: 1, name: "Podstawy HTML" },
  { id: 2, name: "CSS – selektory i layout" },
  { id: 3, name: "JavaScript – podstawy" },
];

// 🔹 Pobierz globalne statystyki z backendu
async function getStats() {
  const res = await fetch("/api/reviews/stats");
  return res.json();
}

// 🔹 Renderuj zestawy z paskiem postępu
async function renderSets() {
  const stats = await getStats();

  const progress = stats.correctRate || 0;
  const color = progress < 70 ? "#f1c40f" : "#4caf50";

  const container = document.getElementById("sets-container");
  container.innerHTML = "";

  sets.forEach((set) => {
    const card = document.createElement("div");
    card.className = "set-card";

    card.innerHTML = `
      <h2>${set.name}</h2>
      <div class="progress-bar">
        <div class="progress-bar-inner"
             style="width: ${progress}%; background: ${color};"></div>
      </div>
      <p style="margin-top: 8px;">Opanowanie: ${progress}%</p>
      <button class="btn" onclick="goToSrs(${set.id})">🔁 Rozpocznij powtórkę</button>
    `;

    container.appendChild(card);
  });
}

// 🔹 Przejście do strony powtórek
function goToSrs(setId) {
  window.location.href = `/srs.html?setId=${setId}`;
}

renderSets();
