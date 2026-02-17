# TODO WordPress Plugin (Shortcode + Inquiry API)

## Cel
- Zintegrowac konfigurator React jako plugin WordPress ze shortcode.
- Frontend NIE jest hostowany na Vercel (ani innej zewnetrznej domenie).
- Build React jest serwowany bezposrednio z WordPress (z domeny aktualnej instalacji WP).
- Wysylac formularz zapytania przez endpoint pluginu:
  - `POST /wp-json/configurator/v1/inquiry`
- Plugin ma wykrywac domene z requestu i budowac poprawne URL/API bez sztywnego wpisywania hosta.

## Zakres MVP
- [ ] Utworzyc plugin `configurator-plugin`.
- [ ] Dodac shortcode `[configurator_plugin]`.
- [ ] W shortcode renderowac kontener:
  - `<div id="configurator-plugin-root"></div>`
- [ ] Podpiac build React (`dist`) do pluginu przez `manifest.json` (Vite).
- [ ] Przekazac do React konfiguracje runtime (`restUrl`, `nonce`, `siteUrl`) przez `wp_localize_script`.
- [ ] Dodac REST endpoint:
  - `POST /wp-json/configurator/v1/inquiry`
- [ ] W endpoint:
  - walidowac dane formularza,
  - wysylac email przez `wp_mail`,
  - zwracac status JSON (`success/error`).

## Zasady hostingu (obowiazkowe)
- [ ] Nie uzywac Vercel do produkcyjnego frontendu konfiguratora.
- [ ] Nie uzywac zewnetrznej domeny jako glownego hosta aplikacji.
- [ ] Wszystkie assety frontendowe sa ladowane z tej samej instalacji WordPress, gdzie plugin jest zainstalowany.
- [ ] Wszystkie endpointy API sa lokalne dla tej instalacji WP: `/wp-json/configurator/v1/...`.

## Domena i URL (wymaganie)
- [ ] Nie hardcodowac domeny.
- [ ] Pobierac baze URL z WP:
  - `home_url()` / `site_url()`
- [ ] Dla CORS preferowac ten sam origin (WP). Whitelist tylko pomocniczo.
- [ ] W React korzystac z przekazanego `restUrl` zamiast stalego hosta.
- [ ] Plugin ma dzialac na dowolnej domenie, na ktorej zostanie zainstalowany (bez zmian kodu).

## Kontrakt endpointu `inquiry`
- [ ] Request body (JSON):
  - `name`, `email`, `phone`,
  - `message`,
  - `selectedOptions`,
  - `price`,
  - `imageUrl` (opcjonalnie).
- [ ] Response:
  - `200` + `{ success: true, message: "..." }`
  - `4xx/5xx` + `{ success: false, message: "..." }`
- [ ] Zabezpieczenia:
  - nonce (jesli wysylka z frontend WP),
  - podstawowy rate-limit / anti-spam,
  - sanityzacja i walidacja email/telefon.

## Przebudowa API (`/wp-json/configurator/v1/...`)
- [ ] Uporzadkowac namespace API:
  - zostaje `configurator/v1` jako warstwa kompatybilna,
  - nowa logika wewnetrznie przygotowana pod latwe przejscie na `v2`.
- [ ] Wydzielic endpointy i odpowiedzialnosci:
  - `POST /wp-json/configurator/v1/inquiry` (wysylka formularza),
  - `POST /wp-json/configurator/v1/upload-image` (upload pliku),
  - opcjonalnie `GET /wp-json/configurator/v1/config` (runtime config dla frontendu).
- [ ] Ujednolicic format odpowiedzi API:
  - `success`, `code`, `message`, `data`.
- [ ] Ujednolicic bledy HTTP:
  - `400` walidacja,
  - `401/403` autoryzacja/nonce,
  - `429` rate limit,
  - `500` blad serwera.
- [ ] Dodac centralna walidacje payloadu (wspolna dla endpointow).
- [ ] Dodac centralny mechanizm antyspamowy:
  - ograniczenie liczby zapytan per IP i/lub fingerprint.
- [ ] Dodac logowanie techniczne (WP debug log) bez danych wrazliwych.
- [ ] Przygotowac kompatybilnosc wsteczna:
  - stary payload mapowany do nowego formatu.
- [ ] Dla frontendu:
  - wszystkie URL API budowane dynamicznie z `rest_url('configurator/v1/')`,
  - brak hardcodu domeny i sciezek.

## Upload obrazu (opcjonalnie MVP+)
- [ ] Endpoint `POST /wp-json/configurator/v1/upload-image`.
- [ ] Walidacja MIME i rozmiaru.
- [ ] Zapis do Media Library i zwrot URL.

## Frontend React (zmiany)
- [ ] Zamienic stale URL API na runtime config z WP.
- [ ] Formularz wysyla dane do `configurator/v1/inquiry`.
- [ ] Obsluzyc komunikaty sukcesu i bledow z endpointu.

## Testy akceptacyjne
- [ ] Shortcode renderuje konfigurator na stronie WP.
- [ ] Formularz wysyla poprawnie z domeny aktualnej instalacji WP.
- [ ] Email dochodzi do biura i (opcjonalnie) potwierdzenie do klienta.
- [ ] Endpoint dziala po zmianie domeny (bez zmian w kodzie React).
- [ ] Brak zaleznosci runtime od Vercel.

## Kolejny krok
- [ ] Przygotowac szkielet pluginu z:
  - shortcode,
  - enqueue buildu Vite,
  - endpointem `inquiry`,
  - przekazaniem runtime config do React.
