# ManageMe (lab-web)

Aplikacja do zarzadzania projektami, historyjkami i zadaniami.

## Zakres funkcjonalny

- CRUD projektow
- CRUD historyjek (todo/doing/done, priorytet, wlasciciel)
- CRUD zadan + szczegoly zadania
- Przypisywanie zadania (developer/devops), automatyczne zmiany statusow
- Powiadomienia (lista, szczegoly, licznik, modal dla medium/high)
- Role uzytkownikow: admin, developer, devops, guest
- Logowanie przez Google OAuth + super admin z konfiguracji
- Tryb jasny/ciemny
- Konfigurowalne storage: `localStorage` albo `database` (Firestore)

## Wymagania

- Node.js 20+ (zalecane LTS)
- npm

## Instalacja

```bash
npm install
```

## Konfiguracja `.env`

Skopiuj `.env.example` do `.env` i uzupelnij wartosci.

Najwazniejsze zmienne:

- `VITE_GOOGLE_CLIENT_ID` - OAuth client ID
- `VITE_SUPER_ADMIN_EMAIL` - email uzytkownika, ktory po logowaniu ma role admin
- `VITE_DATA_STORAGE_MODE` - `localStorage` albo `database`

### Tryb localStorage

```env
VITE_DATA_STORAGE_MODE=localStorage
```

### Tryb Firestore

```env
VITE_DATA_STORAGE_MODE=database
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

## Uruchamianie

```bash
npm run dev
```

Build produkcyjny:

```bash
npm run build
```

## Testy

Unit:

```bash
npm run test:unit
```

E2E (Playwright):

```bash
npm run e2e
```

E2E w trybie widocznym:

```bash
npm run e2e:headed
```

## Architektura (po refaktorze)

- `src/main.ts` - bootstrap aplikacji
- `src/app/AppController.ts` - orchestration UI + event handlers
- `src/app/ViewRenderer.ts` - render glownego layoutu
- `src/use-cases/*` - logika biznesowa workflow
- `src/ports/Repositories.ts` - porty/interfejsy repozytoriow
- `src/services/*` - adaptery infrastruktury i persystencji
- `src/services/storage/AppStorage.ts` - warstwa storage (`localStorage`/Firestore)

## Uwagi

- W trybie `database` aplikacja synchronizuje dane z Firestore i sygnalizuje bledy zapisu.
- E2E domyslnie dziala na lokalnym seedzie danych (stabilne testy frontendu).
