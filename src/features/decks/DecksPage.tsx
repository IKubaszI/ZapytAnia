import { useState } from "react";
import ImportBox from "./ImportBox";
import DeckList from "./DeckList";

export default function DecksPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  //  wywoływane po imporcie lub usunięciu
  function refreshList() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Zestawy słówek</h1>
      <p>Tutaj możesz importować nowe zestawy z pliku .txt</p>

      <ImportBox onImport={refreshList} />
      <DeckList key={refreshKey} onDelete={refreshList} />
    </main>
  );
}
