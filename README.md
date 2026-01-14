
# Testowanie i Jakość Oprogramowania
### Aplikacja jest hostowana na platformie GitHub dostępnym pod adresem: https://ikubaszi.github.io/ZapytAnia/#/

**Autor:** Jakub Szaraj

**Temat projektu:** Aplikacja do nauki języków obcych (Fiszki) z algorytmem SRS

**Opis projektu:** Jest to prosta aplikacja internetowa kompatybilna z komputerami jak i z telefonami umożliwiająca tworzenie, edycję i naukę zestawów fiszek importowanych z pliku txt lub własnoręcznie wprowadzanych. Aplikacja Wykorzystuje prosty algorytm SRS (Spaced Repetition System) do optymalizacji procesu zapamiętywania. Aplikacja działa całkowicie w przeglądarce poprzez IndexedDB. Baze danych można pobrać w formacie .json aby móc przenieść swój postęp na inne urządzenie. 

**UWAGI** Należy pamiętać że baza danych została zaimplementowana poprzez IndexedDB. Co sprawia że wszyskie dane są przechowywane w przeglądarce. Przeglądarka poprosi o zezwolenie na zapisyanie i nie kasowanie ich. aby nie kasować całego postępu w aplikacji. Przeglądarki takie jak DuckDuckGo mogą same usuwać cash i dane z IndexedDB w zależnosci od ich ustawienia. W takim przypadku należy dodać wyjątek do aplikacji aby nie kasować danych użytkownika, lub użyć innej przeglądarki.



**Uruchomienie projektu:** `npm run dev`

**Przykładowe pliki z fiszkami możesz naleźć w folderze** `example_word_txt`

**Technologie użyte w projekcie:** React 19, TypeScript, Vite, Ant Design, Dexie.js (IndexedDB), Vitest (testy), React Router.

## Dokumentacja API
Aplikacja jest typu Client-Side (Frontend Only) i nie posiada własnego backendowego API REST. Cała logika biznesowa oraz baza danych znajdują się po stronie klienta (w przeglądarce).
## Testy

Wszystkie testy znajdują się w katalogu `src/tests`.

### Uruchamianie testów
Aby uruchomić wszystkie testy, użyj komendy:
```bash
npm test
```

### Struktura testów
- `src/tests/features`: Testy integracyjne i jednostkowe dla funkcjonalności (Decks, Quiz, Stats).
- `src/tests/services`: Testy serwisów (np. repozytoria).
- `src/tests/domain`: Testy jednostkowe logiki domenowej (algorytm SRS, parsery).
- `src/tests/smoke.test.ts`: Podstawowy test sprawdzający renderowanie aplikacji.

-----------------------------------------------------------------------------------------------------

## TC001 - Wyświetlanie pytania w trybie standardowym

| **ID** | TC001 |
|--------|-------|
| **Tytuł** | Wyświetlanie pytania w trybie standardowym |
| **Warunki początkowe** | Aplikacja uruchomiona, użytkownik zalogowany, istnieje zestaw z kartami, wybrany tryb SRS |
| **Kroki testowe** | 1. Przejdź do zestawu fiszek<br>2. Kliknij **"Nauka SRS"**<br>3. Sprawdź wyświetloną fiszkę |
| **Oczekiwany rezultat** | Karta z pytaniem jest widoczna, przycisk "Pokaż (Spacja)" jest dostępny, nie widać odpowiedzi |

---

## TC002 - Odwracanie karty w trybie SRS

| **ID** | TC002 |
|--------|-------|
| **Tytuł** | Odwracanie karty spacją w trybie SRS |
| **Warunki początkowe** | Quiz uruchomiony w trybie SRS, wyświetlona pierwsza karta |
| **Kroki testowe** | 1. Naciśnij **spację** lub kliknij "Pokaż"<br>2. Obserwuj animację obrotu<br>3. Sprawdź wyświetloną odpowiedź |
| **Oczekiwany rezultat** | Karta płynnie obraca się (0.6s), odpowiedź pojawia się dopiero po zakończeniu rotacji, widoczne przyciski oceny 1/2/3 |

---

## TC003 - Ocena karty w trybie SRS

| **ID** | TC003 |
|--------|-------|
| **Tytuł** | Ocenianie wiedzy klawiszami 1/2/3 |
| **Warunki początkowe** | Karta odwrócona, widoczna odpowiedź, tryb SRS |
| **Kroki testowe** | 1. Naciśnij klawisz **"3"** (Dobrze)<br>2. Sprawdź czy pojawia się następna karta<br>3. Sprawdź postęp w pasku |
| **Oczekiwany rezultat** | Następna karta pojawia się automatycznie, pasek postępu aktualizuje się, licznik "Fiszka: X / Y" zwiększa się |

---

## TC004 - Tryb odwrócony (Reverse Mode)

| **ID** | TC004 |
|--------|-------|
| **Tytuł** | Przełączanie trybu odwróconego (Pol → Ang) |
| **Warunki początkowe** | Quiz uruchomiony, widoczna pierwsza karta |
| **Kroki testowe** | 1. Kliknij przełącznik **"Rev"** w prawym górnym rogu<br>2. Obróć kartę<br>3. Sprawdź czy pytanie i odpowiedź zamieniły się miejscami |
| **Oczekiwany rezultat** | Pytanie pokazuje polską stronę karty, odpowiedź angielską (odwrotnie niż normalnie) |

---

## TC005 - Funkcja cofania (Undo)

| **ID** | TC005 |
|--------|-------|
| **Tytuł** | Cofanie ostatniej fiski |
| **Warunki początkowe** | Przynajmniej jedna karta została oceniona, widoczna kolejna karta |
| **Kroki testowe** | 1. Naciśnij **Ctrl+Z** (lub Cmd+Z na Mac)<br>2. Sprawdź czy wrócono do poprzedniej karty<br>3. Sprawdź licznik postępu |
| **Oczekiwany rezultat** | Poprzednia karta pojawia się z odwróconą stroną, licznik się cofa|

---

## TC006 - Tryb pisania - poprawna odpowiedź

| **ID** | TC006 |
|--------|-------|
| **Tytuł** | Wpisywanie poprawnej odpowiedzi w trybie Writing |
| **Warunki początkowe** | Quiz uruchomiony w trybie Writing, widoczne pole tekstowe |
| **Kroki testowe** | 1. Przeczytaj pytanie<br>2. Wpisz **poprawną** odpowiedź w pole tekstowe<br>3. Naciśnij **Enter**<br>4. Sprawdź komunikat |
| **Oczekiwany rezultat** | Wyświetla się zielony alert "Dobrze! [odpowiedź]" z ikoną CheckCircle, słyszalny dźwięk TTS z odpowiedzią |

---

## TC007 - Tryb pisania - błędna odpowiedź

| **ID** | TC007 |
|--------|-------|
| **Tytuł** | Wpisywanie niepoprawnej odpowiedzi w trybie Writing |
| **Warunki początkowe** | Quiz uruchomiony w trybie Writing, widoczne pole tekstowe |
| **Kroki testowe** | 1. Przeczytaj pytanie<br>2. Wpisz **błędną** odpowiedź<br>3. Naciśnij **Enter**<br>4. Sprawdź komunikat i poprawną odpowiedź |
| **Oczekiwany rezultat** | Czerwony alert z przekreśloną odpowiedzią użytkownika i poprawną odpowiedzią pod spodem, ikona CloseCircle |

---

## TC008 - Cel dzienny (Daily Goal)

| **ID** | TC008 |
|--------|-------|
| **Tytuł** | Wyświetlanie postępu celu dziennego |
| **Warunki początkowe** | Quiz uruchomiony, cel dzienny ustawiony (np. 20 fiszek) |
| **Kroki testowe** | 1. Sprawdź pasek celu dziennego u góry<br>2. Oceń kilka kart<br>3. Obserwuj aktualizację paska |
| **Oczekiwany rezultat** | Pasek pokazuje "Cel na dziś: X / 20", niebieski pasek postępu rośnie z każdą ocenioną kartą |

---

## TC009 - Zakończenie sesji

| **ID** | TC009 |
|--------|-------|
| **Tytuł** | Wyświetlanie ekranu końcowego po przejściu wszystkich kart |
| **Warunki początkowe** | Quiz z małą liczbą kart, ostatnia karta |
| **Kroki testowe** | 1. Oceń ostatnią kartę w kolejce<br>2. Obserwuj animację konfetti<br>3. Sprawdź przyciski nawigacji |
| **Oczekiwany rezultat** | Konfetti pada z góry ekranu, komunikat "Sesja zakończona!", przyciski "Statystyki" i "Wróć" są dostępne |

---

## TC010 - Hint dla trybu SRS

| **ID** | TC010 |
|--------|-------|
| **Tytuł** | Wyświetlanie właściwego hinta dla trybu SRS |
| **Warunki początkowe** | Quiz w trybie SRS (mode=srs) |
| **Kroki testowe** | 1. Sprawdź tekst u dołu strony<br>2. Zweryfikuj zawartość podpowiedzi |
| **Oczekiwany rezultat** | Hint wyświetla: "Spacja (Pokaż), 1/2/3 (Ocena)" |

---

## TC011 - Hint dla trybu Training

| **ID** | TC011 |
|--------|-------|
| **Tytuł** | Wyświetlanie właściwego hinta dla trybu Training |
| **Warunki początkowe** | Quiz w trybie Training (mode=all) |
| **Kroki testowe** | 1. Sprawdź tekst u dołu strony<br>2. Zweryfikuj zawartość podpowiedzi |
| **Oczekiwany rezultat** | Hint wyświetla: "Spacja (Pokaż), 1 (Źle) / 2 (Dobrze)" |

---

## TC012 - Animacja flip bez przeświecania

| **ID** | TC012 |
|--------|-------|
| **Tytuł** | Sprawdzenie czy odpowiedź nie jest widoczna podczas obrotu karty |
| **Warunki początkowe** | Quiz uruchomiony, karta nieodwrócona |
| **Kroki testowe** | 1. Naciśnij spację aby odwrócić kartę<br>2. **Uważnie obserwuj** środek animacji obrotu (90°)<br>3. Sprawdź czy widać tekst odpowiedzi podczas rotacji |
| **Oczekiwany rezultat** | Podczas rotacji widoczna jest TYLKO karta pytania (początkowo) lub karta odpowiedzi (pod koniec), **NIE MA efektu przeświecania** w połowie obrotu |

---

## TC013 - Słownik Google Translate

| **ID** | TC013 |
|--------|-------|
| **Tytuł** | Otwarcie tłumaczenia Google dla odpowiedzi |
| **Warunki początkowe** | Karta odwrócona, widoczna odpowiedź w trybie standardowym (nie writing) |
| **Kroki testowe** | 1. Po odwróceniu karty kliknij przycisk **"Słownik"**<br>2. Sprawdź czy otwiera się nowa karta przeglądarki |
| **Oczekiwany rezultat** | Otwiera się Google Translate w nowej karcie z wpisanym tekstem odpowiedzi, kierunek tłumaczenia auto→pl |

---

## TC014 - Text-to-Speech dla pytania

| **ID** | TC014 |
|--------|-------|
| **Tytuł** | Synteza mowy dla pytania |
| **Warunki początkowe** | Karta nieodwrócona, widoczne pytanie, tryb standardowy |
| **Kroki testowe** | 1. Kliknij ikonę **głośnika** (SoundOutlined) na karcie<br>2. Sprawdź czy słyszysz wymowę |
| **Oczekiwany rezultat** | Przeglądarka odtwarza tekst pytania w języku angielskim (lang='en-US') używając Web Speech API |

---

## TC015 - Zerowa długość kolejki (SRS)

| **ID** | TC015 |
|--------|-------|
| **Tytuł** | Komunikat braku kart do powtórki w trybie SRS |
| **Warunki początkowe** | Tryb SRS, wszystkie karty przerobione na dzisiaj (0 due cards) |
| **Kroki testowe** | 1. Przejdź do quizu w trybie SRS<br>2. Sprawdź wyświetlony komunikat |
| **Oczekiwany rezultat** | Wyświetla ikonę uśmiechu, tekst "Na dzisiaj koniec!", "Wróć jutro ;)", przycisk "Wróć" |
