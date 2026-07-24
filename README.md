# Pokemon

A simple Pokémon mobile app built with **Expo** for the Senior Developer Assessment. Browse the Pokédex, search by name or number, filter by type, and open any Pokémon to see its stats, breeding info, and moves: all fetched live from [PokeAPI](https://pokeapi.co).

**Project type:** mobile app (Expo / React Native): runs on iOS, Android, or the Expo Go client. No backend of its own, no authentication required.

## Screenshots

|                                                List & search                                                |                                                         Detail                                                          |
| :---------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: |
| <img src="docs/screenshots/list.png" alt="List screen with search bar and Pokémon card grid" width="340" /> | <img src="docs/screenshots/detail.png" alt="Bulbasaur detail screen with stats, breeding info and moves" width="340" /> |

## Features

- **List screen**: 2-column card grid (artwork, name, Pokédex number, type chips) with infinite scroll and pull-to-refresh
- **Search & filter**: client-side search over the full Pokémon index by name (prefix matches rank first) or Pokédex number, plus a type filter that takes any combination of types and returns the Pokémon that have all of them. Search and filter compose: with both on, you get the name matches that are also in every selected type
- **Detail screen**: base stats with color-coded bars, height/weight in metric and imperial, and the full move list behind a "See all" toggle
- **Move details**: tap any move to see its type, damage class, power, accuracy, PP, and effect text
- **Offline persistence**: the Pokédex list, name index and type data are persisted to device storage, so the app opens populated on the next launch and stays browsable offline
- **Dark mode**: follows the system appearance automatically; all colors resolve through semantic tokens, so both schemes share one component tree
- **Artwork fallbacks**: forms without official artwork (mega/gmax variants) fall back to their default sprite, then to a pokéball placeholder
- **Loading, error, and empty states** on every screen: skeleton cards that match the real card geometry, friendly error messages with a working **Try again**, and a "no results" state that names what was searched or filtered for
- **Navigation**: file-based stack navigation with Expo Router (list → detail → move → back)

## Tech stack

| Requirement            | How it's used                                                               |
| ---------------------- | --------------------------------------------------------------------------- |
| Expo (SDK 57)          | App platform + Expo Router for navigation                                   |
| TypeScript             | Strict mode throughout                                                      |
| React Native Paper     | Searchbar, buttons, activity indicators, the filter bottom sheet, MD3 theme |
| NativeWind (v4)        | All layout/spacing/typography styling via Tailwind classes                  |
| TanStack React Query   | Server state: caching, infinite scroll pagination, prefetching, retries     |
| AsyncStorage persister | Persists the small, bounded queries across launches for offline use         |
| expo-image             | Cached, fading artwork images                                               |

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

1. The list screen shows "Who are you looking for?" with a grid of Pokémon cards. Type chips appear on every card a moment after the grid does, as the type index loads.
2. Scroll to the bottom: the next page loads automatically.
3. Type `pika` in the search bar: Pikachu and friends appear; tap a card. Typing a number like `25` finds Pokémon by Pokédex id.
4. Tap the slider icon in the search bar and pick **Grass**, then **Poison**: the grid narrows to Pokémon that have both. Tap a chip under the search bar to remove that type.
5. The detail screen shows stats, breeding info, and moves; tap a move to see its power, accuracy, PP, and effect. The back arrow returns each time.
6. Switch the device to dark mode: every screen follows the system appearance.
7. Airplane mode, then relaunch: the list, search and type filter all still work from the persisted cache. Detail screens are cached in memory for the session only, so after a relaunch they show the error state with a working **Try again**.

## Tests

```bash
npm test               # 150 tests + coverage report (Jest + React Testing Library)
npm run test:watch     # watch mode, without coverage, for iterating
npx tsc --noEmit       # type check
npm run lint           # ESLint
```

### Coverage

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 100%       | 100%     | 100%      | 100%  |

Measured across every file in `src/` (`collectCoverageFrom` in `package.json`), not only the files the tests happen to import. `coverageThreshold` enforces 100% on all four metrics, so `npm test` fails if a single statement, branch or function goes uncovered. No `istanbul ignore` comments are used anywhere: every branch is reached by a real test.

### No mocking of application code

**No module under `src/` is ever mocked.** The screen tests boot the real Expo Router stack over the real route files with `renderRouter('src/app')`: the same `_layout.tsx`, providers, QueryClient, hooks, PokeAPI client and components that run on a device. The only seam is the network: `src/test/fakePokeApi.ts` installs a fake PokeAPI on `globalThis.fetch` that serves a 31-entry dex, and can be steered into going offline, failing a single type, or 404ing a resource.

Three native capabilities have no JavaScript implementation under Jest and are substituted at the platform boundary, each documented where it happens: AsyncStorage (swapped for the library's official in-memory backend), device colour scheme, and the native splash screen. Nothing else is faked.

## Architecture

```
src/
  app/                 # Expo Router screens - routes are files
    _layout.tsx        #   Providers (persisted React Query, Paper) + stack + splash + cache migration
    index.tsx          #   List screen (search, filter, grid, pagination)
    pokemon/[name].tsx #   Detail screen (stats, breeding, moves)
    move/[name].tsx    #   Move detail screen (power, accuracy, PP, effect)
  api/
    pokeapi.ts         #   Typed PokeAPI client + the type-index build (single fetch choke point)
    queryClient.ts     #   The QueryClient, AsyncStorage persister and cache migration
    queryKeys.ts       #   Every query key + the persistence allowlist
    types.ts           #   Minimal response shapes, limited to fields used
  constants/
    api.ts             #   Origins, page size, request timeout, fetch concurrency, search cap
    cache.ts           #   Stale times, retry count, max age, storage keys
    ui.ts              #   Skeleton count, list windowing, screen padding, preview limits
  hooks/               # React Query hooks (list, detail, move, search, types, type index)
                       # + usePokedexBrowser, which composes them into one list state
  components/          # PokemonGrid, SearchHeader, PokemonCard, TypeChip, TypeFilterSheet,
                       # StatBar, Artwork, skeletons, empty & error states…
  theme/               # Design tokens: light/dark Paper themes + Pokémon type colors
  utils/               # Pure formatting helpers (unit-tested)
  test/                # Test harness: the fake PokeAPI, app renderer, appearance & press helpers
```

### Architecture notes

- **Server state over app state.** All remote data lives in React Query's cache; the only local state is UI state (search text, "show all moves"). Redux/Zustand would add indirection without benefit at this scope.
- **Screens compose, hooks decide.** Four independent queries back the list — the paginated Pokédex, the name index behind search, a roster per selected type, and the `name → types` map — and which of them is authoritative depends on whether a search, a filter, both or neither is active. That resolution lives in `usePokedexBrowser`, so `src/app/index.tsx` reads as a composition of `SearchHeader`, `PokemonGrid` and the empty/error states rather than a state machine with JSX wrapped around it.
- **Constants are shared, not hoarded.** `src/constants/` holds the values more than one module reads or that encode a tunable policy — origins, page size, stale times, list windowing. Numbers only one component can meaningfully change (splash timings, the skeleton pulse duration, a pokéball's ring ratio) stay next to that component, so the folder doesn't degrade into a drawer for every literal in the project.
- **One type index instead of a detail per card.** The list endpoint doesn't include types, and fetching a ~200 KB Pokémon detail per card made deep scrolling crawl. Instead the 18 type endpoints are read once into a `name → types` map that every card reads from: 18 requests for the whole Pokédex rather than one per card. The map is built in batches so chips fill in progressively, and it reuses the same cache entries the type filter fetches, so a type is only ever downloaded once.
- **Offline-friendly by construction.** The persisted cache is an allowlist (`src/api/queryKeys.ts`): the list, name index, per-type rosters and type index, all small, bounded `{ id, name }`-shaped data, are written to AsyncStorage per query with a 24h max age. Pokémon and move details are deliberately left in memory only; they are large and unbounded, and persisting them filled up Android's storage. Failed background refetches keep showing cached data.
- **Detail prefetch on press-in.** Tapping a card starts its detail request before the navigation animation begins, so the detail screen usually renders straight from cache without reintroducing the per-card fetch.
- **Search is client-side.** PokeAPI only supports exact-name lookup, so the full index (~1300 entries, a few KB) is fetched once per session and filtered locally: by name, or by Pokédex number when the query is numeric.
- **Degrade, don't block.** The type index is secondary data, so a failure never takes over the screen: cards render without chips and pull-to-refresh rebuilds the index, retrying only the types that actually failed. A run where every type fails rejects rather than resolving empty, so a bad first launch can't persist "no Pokémon has any type" for 24 hours.
- **Design tokens in one place.** The palette lives as CSS variables (`src/global.css`) that flip with the system color scheme, mirrored by light/dark Paper MD3 themes (`src/theme/paperTheme.ts`): dark mode required no per-component styling. Pokémon type colors include a luminance check so light chips (Electric, Ice…) get dark text in both schemes.

## Performance

- **Virtualized list.** The grid is a **`FlatList`** (React Native's virtualized list), not a `ScrollView.map()`: only the visible window of rows is mounted, so memory stays flat no matter how deep you scroll. It's tuned for a 2-column card grid: `initialNumToRender={8}`, `maxToRenderPerBatch={8}`, `windowSize={7}`, with `onEndReachedThreshold={0.4}` driving infinite scroll and `keyExtractor` keyed on the stable Pokémon name.
- **No N+1 on the list.** Types for every card come from the one shared type index (18 requests total), not a detail fetch per card. See the architecture note above: this is the single biggest perf decision in the app.
- **Prefetch on press-in.** `onPressIn` starts the detail request ~100-300 ms before the navigation animation finishes, so the detail screen usually renders straight from React Query's cache instead of showing a spinner.
- **Cheap re-renders.** `PokemonCard` is wrapped in `React.memo` and is purely presentational (artwork derives from the id, types are passed in), so fast scrolling doesn't re-run any data logic. The type-filter intersection uses a module-scope `combine` function, which lets React Query **structurally share** the result array across renders instead of allocating a new one each time.
- **Progressive, non-blocking loading.** The type index publishes each batch of six as it lands, so chips fill in progressively rather than after a long all-or-nothing wait. Skeleton cards match the real card geometry, so nothing shifts when data arrives.
- **Cached, bounded images.** `expo-image` handles on-disk image caching and a 200 ms fade-in; the artwork fallback chain (official art → sprite → drawn pokéball) means a 404 on a mega/gmax form never leaves a broken image or triggers a retry storm.
- **React Compiler on.** `experiments.reactCompiler` is enabled in `app.json`, so components are auto-memoized at build time.
