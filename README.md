# Pokemon

A simple Pokémon mobile app built with **Expo** for the Senior Developer Assessment. Browse the Pokédex, search by name, and open any Pokémon to see its stats, breeding info, and moves — all fetched live from [PokeAPI](https://pokeapi.co).

**Project type:** mobile app (Expo / React Native) — runs on iOS, Android, or the Expo Go client. No backend of its own, no authentication required.

## Screenshots

| List & search | Detail |
|:---:|:---:|
| <img src="docs/screenshots/list.png" alt="List screen with search bar and Pokémon card grid" width="340" /> | <img src="docs/screenshots/detail.png" alt="Bulbasaur detail screen with stats, breeding info and moves" width="340" /> |

## Features

- **List screen** — 2-column card grid (artwork, name, Pokédex number, type chips) with infinite scroll and pull-to-refresh
- **Search** — client-side search over the full Pokémon name index (PokeAPI has no substring-search endpoint); prefix matches rank first
- **Detail screen** — base stats with color-coded bars, height/weight in metric and imperial, and the full move list behind a "See all" toggle
- **Move details** — tap any move to see its type, damage class, power, accuracy, PP, and effect text
- **Offline persistence** — the query cache is persisted to device storage, so everything already seen renders instantly on the next launch and stays browsable offline
- **Dark mode** — follows the system appearance; all colors resolve through semantic tokens, so both schemes share one component tree
- **Artwork fallbacks** — forms without official artwork (mega/gmax variants) fall back to their default sprite, then to a pokéball placeholder
- **Loading, error, and empty states** on every screen — skeleton cards that match the real card geometry, friendly error messages with a working **Try again**, and a "no results" state for search
- **Navigation** — file-based stack navigation with Expo Router (list → detail → move → back)

## Tech stack

| Requirement | How it's used |
|---|---|
| Expo (SDK 57) | App platform + Expo Router for navigation |
| TypeScript | Strict mode throughout |
| React Native Paper | Searchbar, buttons, activity indicators, MD3 theme |
| NativeWind (v4) | All layout/spacing/typography styling via Tailwind classes |
| TanStack React Query | Server state: caching, infinite scroll pagination, retries |
| AsyncStorage persister | Persists the query cache across launches for offline use |
| expo-image | Cached, fading artwork images |

## Getting started

Prerequisites: **Node.js 20+** and npm. For a simulator you'll need Xcode (iOS) or Android Studio (Android); otherwise install the **Expo Go** app on your phone.

```bash
npm install
npx expo start
```

Then:

- press **i** to open the iOS simulator, **a** for the Android emulator, or
- scan the QR code with **Expo Go** on a physical device (phone and computer must share a network).

### Verify it works

1. The list screen shows "Who are you looking for?" with a grid of Pokémon cards.
2. Scroll to the bottom — the next page loads automatically.
3. Type `pika` in the search bar — Pikachu and friends appear; tap a card.
4. The detail screen shows stats, breeding info, and moves; tap a move to see its power, accuracy, PP, and effect. The back arrow returns each time.
5. Switch the device to dark mode — every screen follows the system appearance.
6. Airplane mode: everything you've already seen still renders from the persisted cache, and screens you haven't visited show the error state with a working **Try again**.

## Tests

```bash
npm test
```

34 unit tests cover the formatting utilities (heights, weights, ids, names, effect text), the theme helpers (type colors, contrast, stat colors), the PokeAPI client (URL building, pagination, 404/network error handling — with `fetch` mocked at the network boundary), and component rendering/interaction for `PokemonCard` and `StatBar` via React Testing Library.

## Project structure

```
src/
  app/                 # Expo Router screens
    _layout.tsx        #   Providers (persisted React Query, Paper) + stack
    index.tsx          #   List screen (search, grid, pagination)
    pokemon/[name].tsx #   Detail screen (stats, breeding, moves)
    move/[name].tsx    #   Move detail screen (power, accuracy, PP, effect)
  api/                 # Typed PokeAPI client + response types
  hooks/               # React Query hooks (list, detail, move, search)
  components/          # PokemonCard, TypeChip, StatBar, Artwork, skeletons, error state…
  theme/               # Design tokens: light/dark Paper themes + Pokémon type colors
  utils/               # Pure formatting helpers (unit-tested)
```

## Architecture notes

- **Server state over app state.** All remote data lives in React Query's cache; the only local state is UI state (search text, "show all moves"). Redux/Zustand would add indirection without benefit at this scope.
- **Cards share the detail query.** The list endpoint doesn't include types, so each card fetches its Pokémon's detail through the *same cached query* the detail screen uses (`staleTime: Infinity` — base Pokémon data never changes mid-session). By the time a card is visible, its detail screen opens instantly from cache.
- **Offline-friendly by construction.** The whole React Query cache is persisted to AsyncStorage (24h max age), so previously seen lists, details, and moves survive restarts and work without a connection; failed background refetches keep showing cached data.
- **Search is client-side.** PokeAPI only supports exact-name lookup, so the full name index (~1300 entries, a few KB) is fetched once per session and filtered locally.
- **Design tokens in one place.** The palette lives as CSS variables (`src/global.css`) that flip with the system color scheme, mirrored by light/dark Paper MD3 themes (`src/theme/paperTheme.ts`) — dark mode required no per-component styling. Pokémon type colors include a luminance check so light chips (Electric, Ice…) get dark text in both schemes.
