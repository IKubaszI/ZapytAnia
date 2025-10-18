async function loadStats() {
  const res = await fetch("/api/reviews/stats");
  const data = await res.json();

  // 🔹 Wstaw dane liczbowe
  document.getElementById("totalReviews").textContent = data.totalReviews;
  document.getElementById("correctRate").textContent = `${data.correctRate}%`;
  document.getElementById("streak").textContent = data.streak;

  // 🔹 Jeśli nie ma danych — komunikat
  if (data.chartData.length === 0) {
    const ctx = document.getElementById("chart").getContext("2d");
    ctx.font = "20px Arial";
    ctx.fillText("Brak danych do wyświetlenia", 200, 150);
    return;
  }

  // 🔹 Wykres (Chart.js)
  const ctx = document.getElementById("chart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.chartData.map((d) => d.day),
      datasets: [
        {
          label: "Liczba powtórek",
          data: data.chartData.map((d) => d.count),
          backgroundColor: "rgba(76, 175, 80, 0.4)",
          borderColor: "#4CAF50",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

loadStats();
