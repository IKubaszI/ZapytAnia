import ImportBox from "./ImportBox";

export default function DecksPage() {
  return (
    <main className="container">
      <h1>Zestawy słówek</h1>
      <p>Tutaj możesz importować nowe zestawy z pliku .txt</p>

      <ImportBox />
    </main>
  );
}
