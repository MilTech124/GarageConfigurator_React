# Instrukcje implementacji WordPress dla konfiguratora garażu (wersja uproszczona)

## Przegląd zmian

Zastąpiono EmailJS obsługą przez WordPress functions.php, co zapewnia:
- Lepszą kontrolę nad wysyłaniem maili
- Ładnie sformatowane maile HTML z pełną konfiguracją garażu
- Większą niezawodność
- **Bez zapisu do bazy danych** - tylko wysyłanie maili

## Pliki do implementacji

### 1. Frontend (React)
- `src/utils/SendMailWP.js` - nowa funkcja wysyłania maili przez WordPress API
- `src/components/configurator/Modal.jsx` - zaktualizowany import

### 2. Backend (WordPress)
- `wordpress-functions-simple.php` - uproszczony kod do dodania do functions.php

## Instrukcje implementacji

### Krok 1: Aktualizacja WordPress

1. **Dodaj kod do functions.php**
   ```php
   // Skopiuj całą zawartość pliku wordpress-functions-simple.php
   // i wklej na końcu pliku functions.php w aktywnym motywie WordPress
   ```

2. **Konfiguracja emaila**
   - Przejdź do Ustawienia → Ogólne w panelu WordPress
   - Znajdź pole "Email konfiguratora garażu"
   - Ustaw adres email, na który mają przychodzić zapytania (domyślnie: jaroslawmatusiak124@gmail.com)

### Krok 2: Aktualizacja aplikacji React

1. **Nowy plik SendMailWP.js już utworzony**
2. **Modal.jsx już zaktualizowany**

### Krok 3: Testowanie

1. **Sprawdź endpoint WordPress**
   ```
   https://newgarage.pl/wp-json/newgarage/v1/send-email
   ```

2. **Test wysyłania**
   - Wypełnij formularz w konfiguratorze
   - Sprawdź czy email dotarł na skonfigurowany adres

## Funkcjonalności

### 1. Wysyłanie maili
- **Endpoint**: `https://newgarage.pl/wp-json/newgarage/v1/send-email`
- **Metoda**: POST
- **Format**: JSON
- **Walidacja**: podstawowe dane kontaktowe i format email

### 2. Format emaila HTML
Email zawiera:
- **Dane kontaktowe** - imię, email, telefon, województwo, adres
- **Cenę** - wyróżnioną wizualnie
- **Wizualizację garażu** - zdjęcie z konfiguratora
- **Szczegółową konfigurację**:
  - Podstawowe parametry (wymiary, kolor, tłoczenie)
  - Dach (typ, kolor, pokrycie)
  - Bramy (typ, wymiary, kolory)
  - Drzwi i okna (liczba i szczegóły)
  - Carport (jeśli wybrany)
  - Dodatki (rynny, automatyka, filc, transport)
- **Informacje systemowe** - data, IP, user agent

## Struktura danych wysyłanych

```javascript
{
  template_type: "configurator",
  contact: {
    name: "Jan Kowalski",
    email: "jan@example.com",
    phone: "123456789",
    wojewodztwo: "mazowieckie",
    address: "ul. Przykładowa 1, Warszawa",
    message: "Dodatkowe informacje"
  },
  garage_config: {
    // Podstawowe parametry
    width: 6,
    depth: 6,
    height: 213,
    color: "Złoty Dąb",
    emboss: "wąskie",
    direction: "poziom",
    
    // Dach
    roof: "dwuspad",
    roofColor: "Antracyt",
    roofType: "trapezowa",
    
    // Bramy
    gateCount: 2,
    gateType1: "uchylna",
    gateColor1: "Złoty Dąb",
    gateWidth1: 3,
    gateHeight1: 200,
    
    // Drzwi i okna
    doors: "szczegóły drzwi",
    windows: "szczegóły okien",
    doorCount: 1,
    windowCount: 2,
    
    // Carport
    carport: false,
    carportWidth: 3,
    carportSide: "lewo",
    carportSides: "szczegóły ścian",
    
    // Dodatki
    gutter: false,
    automatic: false,
    filc: false,
    transport: true
  },
  price: 25000,
  imageURL: "https://newgarage.pl/wp-content/uploads/screenshot.png"
}
```

## Przykład wygenerowanego emaila

Email będzie zawierał:

```
🏠 Nowe zapytanie z konfiguratora garażu
Otrzymano nowe zapytanie od klienta

📞 Dane kontaktowe
Imię i nazwisko: Jan Kowalski
Email: jan@example.com
Telefon: 123456789
Województwo: mazowieckie
Adres dostawy: ul. Przykładowa 1, Warszawa

💰 Cena z transportem: 25 000 zł

📸 Wizualizacja garażu
[Zdjęcie garażu]

🏗️ Konfiguracja garażu

Podstawowe parametry:
Szerokość: 6 m
Głębokość: 6 m
Wysokość: 213 cm
Kolor: Złoty Dąb
Tłoczenie: wąskie
Kierunek: poziom

Dach:
Typ dachu: dwuspad
Kolor dachu: Antracyt
Rodzaj pokrycia: trapezowa

Bramy:
Liczba bram: 2
Brama 1: uchylna - Złoty Dąb - 3m x 200cm
Brama 2: uchylna - Złoty Dąb - 3m x 200cm

Dodatki:
Rynny: Nie
Automatyka: Nie
Filc: Nie
Transport: Tak

📅 Informacje systemowe
Data zapytania: 31.07.2025 21:12:00
IP klienta: 192.168.1.1
User Agent: Mozilla/5.0...
```

## Bezpieczeństwo

1. **Walidacja danych** - sprawdzanie wymaganych pól i formatu email
2. **Sanityzacja** - wszystkie dane są escapowane przed wyświetleniem
3. **Ochrona przed XSS** - użycie funkcji WordPress esc_html(), esc_attr(), esc_url()
4. **Honeypot** - ochrona przed botami (już zaimplementowana w formularzu)

## Różnice względem pełnej wersji

Ta uproszczona wersja **NIE zawiera**:
- Zapisu do bazy danych
- Panelu administracyjnego WordPress
- Funkcji przeglądania zapytań
- Tabeli w bazie danych

**Zawiera tylko**:
- Endpoint REST API do wysyłania maili
- Ładnie sformatowany szablon emaila HTML
- Opcję konfiguracji adresu email w panelu WordPress

## Troubleshooting

### Problem: Email nie dociera
1. Sprawdź konfigurację SMTP w WordPress
2. Sprawdź logi błędów WordPress
3. Sprawdź czy funkcja `wp_mail()` działa poprawnie
4. Sprawdź folder spam

### Problem: Błąd 404 na endpoint
1. Sprawdź czy kod został dodany do functions.php
2. Odśwież permalinki w WordPress (Ustawienia → Permalinki → Zapisz)

### Problem: Błąd CORS
1. Nagłówki CORS zostały dodane do `wordpress-functions-simple.php` (`Access-Control-Allow-Origin: *`).
2. Jeśli problem nadal występuje, upewnij się, że Twój serwer WordPress nie ma innych konfiguracji CORS, które mogą nadpisywać te nagłówki (np. w pliku `.htaccess` lub konfiguracji serwera Nginx/Apache).
3. W środowisku produkcyjnym zaleca się zmianę `Access-Control-Allow-Origin: *` na konkretną domenę Twojego frontendu (np. `Access-Control-Allow-Origin: https://twoja-domena-frontendu.pl`).

### Problem: Błędne formatowanie emaila
1. Sprawdź czy wszystkie dane są przekazywane poprawnie
2. Sprawdź konsolę przeglądarki pod kątem błędów JavaScript
3. Sprawdź response z WordPress API

## Testowanie

1. **Test endpoint**:
   ```bash
   curl -X POST https://newgarage.pl/wp-json/newgarage/v1/send-email \
   -H "Content-Type: application/json" \
   -d '{"contact":{"name":"Test","email":"test@example.com","phone":"123456789"}}'
   ```

2. **Test z konfiguratora**:
   - Wypełnij formularz
   - Sprawdź Network tab w przeglądarce
   - Sprawdź czy email dotarł

## Kontakt techniczny

W przypadku problemów z implementacją, sprawdź:
1. Logi błędów WordPress (`/wp-content/debug.log`)
2. Logi błędów serwera
3. Konsolę przeglądarki (Network tab)
4. Response z endpoint WordPress API
