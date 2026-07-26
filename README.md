# Pokemon

A Pokémon mobile app built with **Expo** for the Senior Developer Assessment. Browse the Pokédex, search by name or number, filter by type, and open any Pokémon for its stats, breeding info and moves, all live from [PokeAPI](https://pokeapi.co).

**Project type:** mobile app (Expo / React Native), runs on iOS, Android or Expo Go. No backend, no authentication.

## Screenshots

|                                                List & search                                                |                                                         Detail                                                          |
| :---------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: |
| <img width="340" alt="List screen with search bar and Pokémon card grid" src="https://github.com/user-attachments/assets/d21b4e16-810b-4c90-bebf-f73aa4708443" /> | <img width="340" alt="Bulbasaur detail screen with stats, breeding info and moves" src="https://github.com/user-attachments/assets/410874d1-d7fc-416e-a69a-9f1ab34bdb1e" /> |

## Features

- **List**: 2-column grid (artwork, name, Pokédex number, type chips) with infinite scroll and pull-to-refresh
- **Search & filter**: client-side search by name (prefixes rank first) or Pokédex number, plus a type filter returning the Pokémon that have *all* the selected types. The two compose, and the filter stops at two types because no Pokémon has a third.
- **Detail**: base stats with a colour per stat, height and weight in imperial and metric, full move list behind a "See all" toggle
- **Move details**: type, damage class, power, accuracy, Power Points (PP) and effect text
- **Offline**: list, name index and type data persist to device storage, so the app opens populated and stays browsable
- **Dark mode**: follows system appearance through semantic tokens; one component tree serves both schemes
- **Artwork fallbacks**: forms without official art (mega/gmax) fall back to their sprite, then to a drawn pokéball
- **Loading, error and empty states** on every screen, each with a working **Try again**, plus a route-level error boundary so an unexpected response cannot leave a blank screen
- **Navigation**: file-based stack via Expo Router (list → detail → move)
- **Accessibility**: labelled controls with hints and selection state, headings for rotor navigation, text that scales with the system size, and animation that stops when the system asks for reduced motion. Contrast is held to WCAG AA by a test.

## Tech stack

| Requirement            | How it's used                                                               |
| ---------------------- | --------------------------------------------------------------------------- |
| Expo (SDK 54)          | App platform + Expo Router for navigation                                   |
| TypeScript             | Strict mode throughout                                                      |
| React Native Paper     | Searchbar, buttons, activity indicators, the filter bottom sheet, MD3 theme |
| NativeWind (v4)        | All layout/spacing/typography styling via Tailwind classes                  |
| TanStack React Query   | Server state: caching, infinite scroll pagination, prefetching, retries     |
| Zod                    | Parses every PokeAPI response at the boundary; the TS types are inferred from the schemas |
| AsyncStorage persister | Persists the small, bounded queries across launches for offline use         |
| expo-image             | Cached, fading artwork images                                               |

## Getting started

Needs **Node.js 20+** and npm. For a simulator: Xcode (iOS) or Android Studio (Android). Otherwise install **Expo Go** on your phone.

```bash
npm install
npx expo start
```

Then press **i** for the iOS simulator, **a** for the Android emulator, or scan the QR code with Expo Go (phone and computer on the same network).

> Targets **SDK 54** deliberately. One Expo Go build runs one SDK, and the App Store hands older phones an older Expo Go: bumping the SDK makes the QR code unscannable on those devices.

### Verify it works

1. The list shows "Who are you looking for?" over a grid of cards; type chips fill in as the index loads.
2. Scroll to the bottom: the next page loads automatically.
3. Two separate searches: Search `pika` on its own: Pikachu heads the results, matched by name. Clear the field, then search `25`: Pikachu leads again, this time matched by Pokédex number.
4. Tap the slider icon, pick **Grass** then **Poison**: the grid narrows to Pokémon with both, and the remaining chips grey out. Tap a chip to remove it.
5. Open a Pokémon, then one of its moves. The back arrow returns each time.
6. Switch the device to dark mode: every screen follows.
7. Airplane mode, then relaunch: list, search and filter still work from cache. Details are memory-only, so they show the error state with **Try again**.

## Tests

```bash
npm test               # full suite + coverage report (Jest + React Testing Library)
npm run test:watch     # watch mode, without coverage
npx tsc --noEmit       # type check
npm run lint           # ESLint
```

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 100%       | 100%     | 100%      | 100%  |

Measured across every file in `src/`, not only the ones tests happen to import. `coverageThreshold` enforces 100% on all four metrics.

All three commands run on every push and pull request via [GitHub Actions](.github/workflows/ci.yml), so an untested line fails the build as readily as a failing assertion. CI also runs `npm run bundle:check`, which exports the Android bundle and fails if it crosses 6 MB — a dependency that doubles the download is invisible to the other three.

### Measured

| What | Value |
| ---- | ----- |
| Android JS bundle (Hermes bytecode) | 5.00 MB (measured in CI), against a 6 MB ceiling |
| Zod parse of the 1302-entry name index | 0.25 ms |
| Grid at ~7 pages deep, iPhone 15 Pro simulator | No blank cells, no row drift (Maestro fling test) |

The remaining Performance claims below are reasoned, not measured — the prefetch
window has not been profiled, and no Android device has run the app yet.

### End-to-end

```bash
maestro test .maestro/smoke.yaml          # standalone build (expo run:ios / run:android)
maestro test .maestro/smoke-expo-go.yaml  # Expo Go workflow; needs `npx expo start` running
```

One flow — launch, search, open a detail, go back — covering the one thing the Jest
suite cannot: that the app runs on a device. The **Expo Go variant passes** on an
iPhone 15 Pro simulator (iOS 17.5); the same session fling-tested the grid seven pages
deep with no blank cells or row drift, which is the `getItemLayout` contract holding on
a real screen. The standalone variant is the same flow against a native build and has
not been run — this machine's toolchain cannot produce one. Neither is in CI, which has
no device attached.

### No mocking of application code

**No module under `src/` is ever mocked.** Screen tests boot the real Expo Router stack over the real route files: the same layout, providers, QueryClient, hooks, PokeAPI client and components that run on a device.

## Architecture

```
src/
  app/                 # Expo Router screens: routes are files
    _layout.tsx        #   Providers (persisted React Query, Paper) + stack + splash + cache migration
    index.tsx          #   List screen: composes header, grid and filter sheet; state from usePokedexBrowser
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
  theme/               # Light/dark Paper themes + the type and base-stat colour scales
  global.css           # Semantic CSS variables behind the Tailwind classes; flip with the colour scheme
  utils/               # Pure formatting helpers (unit-tested)
  test/                # Test harness: the fake PokeAPI, app renderer, appearance & press helpers, CSS stub
```

## Releases

Build profiles live in [eas.json](eas.json): `development`, `preview` and `production`.

**`app.json` owns both the version and the build number.** `version` (1.0.0) is the
user-facing string, and `runtimeVersion` is tied to it — an over-the-air update can only
reach a binary built from the same native runtime. `ios.buildNumber` and
`android.versionCode` sit beside it and are bumped by hand per release, with
`appVersionSource: "local"` telling EAS to read them from here. Everything a build needs
is in the repo, so cloning it is enough — no EAS project or account is required to build.
Once releases run through CI rather than by hand, the build number should move to EAS
(`appVersionSource: "remote"` + `autoIncrement`), which is the version of this decision
that removes the human from the loop.

## Observability

Failures are reported through one seam, `src/api/reportError.ts`, called from three
places: the query cache (every failed query), the route error boundary (any render that
throws), and nothing else. **No reporter is installed** — `reportError` is a no-op until
`setErrorReporter` is called, which is deliberate: the call sites are the part that is
awkward to retrofit and they are in place, so adopting a vendor is one line in
`src/app/_layout.tsx`:

```ts
import * as Sentry from '@sentry/react-native';
setErrorReporter((error, context) => Sentry.captureException(error, { extra: context }));
```

Reporting is filtered by `ApiError.kind`. A dropped connection or a timeout is not a
defect and is not reported — the type index alone would send nineteen of them from one
offline launch. What is reported is the class of failure that means the API moved:
a response that will not parse, or one that no longer matches its schema.

## Performance

- **Virtualized list.** A `FlatList`, not `ScrollView.map()`: only the visible window mounts, so memory stays flat however deep you scroll. Tuned for the 2-column grid: `initialNumToRender={8}`, `maxToRenderPerBatch={8}`, `windowSize={7}`, `onEndReachedThreshold={0.4}`.
- **No N+1.** Card types come from the one shared type index (18 requests), not a detail fetch per card: the biggest performance decision in the app.
- **Prefetch on press-in.** Buys ~100-300 ms before the navigation animation ends, usually avoiding a spinner entirely. The search index is prefetched on field focus for the same reason.
- **Deferred search, not debounced.** There is no request per keystroke to suppress - the name index is fetched once and filtered locally - so the cost is rendering. `useDeferredValue` keeps the field responsive without adding the latency a debounce would.
- **One request per refresh.** Pull-to-refresh collapses the infinite query to its first page before refetching; `refetch()` alone would re-request every page loaded so far.
- **Cheap re-renders.** `PokemonCard` is `React.memo` and purely presentational, so fast scrolling re-runs no data logic. The type-filter intersection uses a module-scope `combine`, letting React Query structurally share the result array across renders.
- **Progressive loading.** The type index publishes each batch of six as it lands, and skeleton cards match the real card geometry, so nothing shifts when data arrives.
- **No row measurement.** Card geometry is data (`CARD_METRICS`), so the grid can give `FlatList` an exact `getItemLayout` instead of measuring every row — the usual cause of blank cells during a fast Android fling. The height scales with the system font size, so capping text growth and pinning row height stay consistent. `removeClippedSubviews` is deliberately left off until that can be watched on hardware: it decides what to detach from the layout `getItemLayout` asserts, and pairing the two unverified trades a visible bug against an unmeasured gain.
- **Cached images.** `expo-image` handles on-disk caching and a 200 ms fade-in; the fallback chain (official art → sprite → drawn pokéball) means a 404 on a mega form never leaves a broken image or a retry storm.
- **React Compiler on** via `experiments.reactCompiler` in `app.json`, so components are auto-memoized at build time.
