# Instrukcje implementacji WordPress dla konfiguratora garażu

## Przegląd zmian

Zastąpiono EmailJS obsługą przez WordPress functions.php, co zapewnia:
- Lepszą kontrolę nad wysyłaniem maili
- Ładnie sformatowane maile HTML
- Zapis zapytań do bazy danych WordPress
- Panel administracyjny do przeglądania zapytań
- Większą niezawodność

## Pliki do implementacji

### 1. Frontend (React)
- `src/utils/SendMailWP.js` - nowa funkcja wysyłania maili przez WordPress API
- `src/components/configurator/Modal.jsx` - zaktualizowany import

### 2. Backend (WordPress)
- `wordpress-functions.php` - kod do dodania do functions.php

## Instrukcje implementacji

### Krok 1: Aktualizacja WordPress

1. **Dodaj kod do functions.php**
   ```php
   // Skopiuj całą zawartość pliku wordpress-functions.php
   // i wklej na końcu pliku functions.php w aktywnym motywie WordPress
   ```

2. **Konfiguracja emaila**
   - Przejdź do Ustawienia → Ogólne w panelu WordPress
   - Znajdź pole "Email konfiguratora garażu"
   - Ustaw adres email, na który mają przychodzić zapytania (domyślnie: biuro@newgarage.pl)

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
   - Sprawdź panel administracyjny WordPress

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

### 3. Panel administracyjny
- **Menu**: "Konfigurator" w panelu WordPress
- **Lista zapytań** - ostatnie 50 zapytań
- **Szczegóły** - pełny podgląd każdego zapytania
- **Dane kontaktowe** - klikalne linki email i telefon

### 4. Baza danych
Automatycznie tworzona tabela `wp_garage_inquiries` z polami:
- Dane kontaktowe
- Konfiguracja garażu (JSON)
- Cena
- URL zdjęcia
- Informacje systemowe

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

## Bezpieczeństwo

1. **Walidacja danych** - sprawdzanie wymaganych pól i formatu email
2. **Sanityzacja** - wszystkie dane są escapowane przed wyświetleniem
3. **Rate limiting** - można dodać ograniczenia częstotliwości zapytań
4. **Honeypot** - ochrona przed botami (już zaimplementowana w formularzu)

## Możliwe rozszerzenia

1. **Powiadomienia SMS** - integracja z bramką SMS
2. **CRM** - automatyczne dodawanie leadów do systemu CRM
3. **Automatyczne odpowiedzi** - wysyłanie potwierdzenia do klienta
4. **Eksport danych** - możliwość eksportu zapytań do CSV/Excel
5. **Statystyki** - dashboard z analizą zapytań

## Troubleshooting

### Problem: Email nie dociera
1. Sprawdź konfigurację SMTP w WordPress
2. Sprawdź logi błędów WordPress
3. Sprawdź czy funkcja `wp_mail()` działa poprawnie

### Problem: Błąd 404 na endpoint
1. Sprawdź czy kod został dodany do functions.php
2. Odśwież permalinki w WordPress (Ustawienia → Permalinki → Zapisz)

### Problem: Błąd CORS
1. Sprawdź czy domena jest prawidłowo skonfigurowana
2. Dodaj nagłówki CORS jeśli potrzebne

### Problem: Brak zapisu do bazy
1. Sprawdź uprawnienia do bazy danych
2. Sprawdź logi błędów MySQL
3. Sprawdź czy tabela została utworzona poprawnie

## Kontakt techniczny

W przypadku problemów z implementacją, sprawdź:
1. Logi błędów WordPress (`/wp-content/debug.log`)
2. Logi błędów serwera
3. Konsolę przeglądarki (Network tab)
4. Response z endpoint WordPress API
