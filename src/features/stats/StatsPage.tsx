import { useEffect, useState } from "react";
import { db } from "../../data/db";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

type DailyStats = {
  date: string;
  reviews: number;
  correct: number;
};

export default function StatsPage() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [summary, setSummary] = useState({ total: 0, correct: 0, streak: 0 });

  useEffect(() => {
    async function loadStats() {
      const reviews = await db.reviews.toArray();
      if (!reviews.length) return;

      // Grupowanie po dniu
      const grouped: Record<string, { reviews: number; correct: number }> = {};
      for (const r of reviews) {
        const day = new Date(r.ts).toLocaleDateString("pl-PL");
        if (!grouped[day]) grouped[day] = { reviews: 0, correct: 0 };
        grouped[day].reviews++;
        if (r.quality >= 3) grouped[day].correct++;
      }

      // Konwersja do tablicy i sortowanie po dacie
      const daily: DailyStats[] = Object.entries(grouped)
        .map(([date, { reviews, correct }]) => ({ date, reviews, correct }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setStats(daily);

      // Oblicz sumy
      const total = reviews.length;
      const correct = reviews.filter((r) => r.quality >= 3).length;

      // 🔹 Liczymy streak dni z nauką
      let streak = 0;
      const today = new Date().toLocaleDateString("pl-PL");
      const reversed = daily.slice().reverse();
      for (const day of reversed) {
        streak++;
        if (day.date === today) continue;
        const prev = new Date(day.date);
        const diff = (new Date(today).getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff > streak) break;
      }

      setSummary({ total, correct, streak });
    }

    loadStats();
  }, []);

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <h1>📊 Statystyki nauki</h1>

      {stats.length === 0 ? (
        <p>Brak danych — wykonaj kilka powtórek w quizie.</p>
      ) : (
        <>
          <section
            style={{
              display: "flex",
              gap: 30,
              marginBottom: 30,
              background: "#f9f9f9",
              padding: 20,
              borderRadius: 8,
            }}
          >
            <div>
              <strong>Łącznie powtórek:</strong>
              <p>{summary.total}</p>
            </div>
            <div>
              <strong>Poprawnych odpowiedzi:</strong>
              <p>{summary.correct}</p>
            </div>
            <div>
              <strong>Seria dni nauki:</strong>
              <p>{summary.streak} 🔥</p>
            </div>
          </section>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="reviews" stroke="#00796b" name="Powtórki" />
              <Line type="monotone" dataKey="correct" stroke="#5cb85c" name="Poprawne" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </main>
  );
}
