# Pokédex

A simple Pokémon mobile app built with **Expo** for the Senior Developer Assessment. Browse the Pokédex, search by name, and open any Pokémon to see its stats, breeding info, and moves — all fetched live from [PokeAPI](https://pokeapi.co).

**Project type:** mobile app (Expo / React Native) — runs on iOS, Android, or the Expo Go client. No backend of its own, no authentication required.

## Features

- **List screen** — 2-column card grid (artwork, name, Pokédex number, type chips) with infinite scroll and pull-to-refresh
- **Search** — client-side search over the full Pokémon name index (PokeAPI has no substring-search endpoint); prefix matches rank first
- **Detail screen** — base stats with color-coded bars, height/weight in metric and imperial, and the full move list behind a "See all" toggle
- **Loading, error, and empty states** on every screen — skeleton cards that match the real card geometry, friendly error messages with a working **Try again**, and a "no results" state for search
- **Navigation** — file-based stack navigation with Expo Router (list → detail → back)

## Tech stack

| Requirement | How it's used |
|---|---|
| Expo (SDK 57) | App platform + Expo Router for navigation |
| TypeScript | Strict mode throughout |
| React Native Paper | Searchbar, buttons, activity indicators, MD3 theme |
| NativeWind (v4) | All layout/spacing/typography styling via Tailwind classes |
| TanStack React Query | Server state: caching, infinite scroll pagination, retries |
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
4. The detail screen shows stats, breeding info, and moves; the back arrow returns to the list.
5. Airplane mode + pull-to-refresh shows the error state; **Try again** recovers after reconnecting.

## Tests

```bash
npm test
```

29 unit tests cover the formatting utilities (heights, weights, ids, names), the theme helpers (type colors, contrast, stat colors), the PokeAPI client (URL building, pagination, 404/network error handling — with `fetch` mocked at the network boundary), and component rendering/interaction for `PokemonCard` and `StatBar` via React Testing Library.

## Project structure

```
src/
  app/                 # Expo Router screens
    _layout.tsx        #   Providers (React Query, Paper) + stack
    index.tsx          #   List screen (search, grid, pagination)
    pokemon/[name].tsx #   Detail screen (stats, breeding, moves)
  api/                 # Typed PokeAPI client + response types
  hooks/               # React Query hooks (list, detail, search)
  components/          # PokemonCard, TypeChip, StatBar, skeletons, error state…
  theme/               # Design tokens: Paper theme + Pokémon type colors
  utils/               # Pure formatting helpers (unit-tested)
```

## Architecture notes

- **Server state over app state.** All remote data lives in React Query's cache; the only local state is UI state (search text, "show all moves"). Redux/Zustand would add indirection without benefit at this scope.
- **Cards share the detail query.** The list endpoint doesn't include types, so each card fetches its Pokémon's detail through the *same cached query* the detail screen uses (`staleTime: Infinity` — base Pokémon data never changes mid-session). By the time a card is visible, its detail screen opens instantly from cache.
- **Search is client-side.** PokeAPI only supports exact-name lookup, so the full name index (~1300 entries, a few KB) is fetched once per session and filtered locally.
- **Design tokens in one place.** The Tailwind palette and the Paper MD3 theme are kept in sync (`src/theme/paperTheme.ts`), and Pokémon type colors include a luminance check so light chips (Electric, Ice…) get dark text.

## Known limitations / future work

- Moves are listed by name only (no move detail navigation).
- No offline persistence — the cache is in-memory per session.
- Dark mode is not implemented (the reference mockup is light-only); the token setup makes it a small follow-up.
- Forms with ids above 10000 (mega/gmax variants) appear in search and resolve correctly, but some lack official artwork.
