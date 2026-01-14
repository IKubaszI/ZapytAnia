import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import '@ant-design/v5-patch-for-react-19';
import './index.css';
import './i18n/config';

// --- ZABEZPIECZENIE DANYCH ---
async function initStoragePersistence() {
  if (navigator.storage && navigator.storage.persist) {
    // Sprawdź, czy już mamy zgodę
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      // Jeśli nie, poproś o nią
      const result = await navigator.storage.persist();
      console.log(`Zgoda na trwałe dane: ${result ? 'PRZYZNANA ' : 'ODMOWA '}`);
    } else {
      console.log('Dane są już bezpieczne (Persisted)');
    }
  }
}

// Uruchomienie zabezpieczenia
initStoragePersistence();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);