/**
 * Everything about *where* and *how much* the app fetches. Centralised so the
 * client, the sprite URL helpers and the paging maths can never disagree, and
 * so tuning a limit is a one-line change rather than a grep.
 */

// HTTPS only. Kept as a constant so a plain-HTTP or attacker-controlled base can
// never be introduced by a typo elsewhere in the client.
export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Where PokeAPI hosts its PNGs. Separate from the JSON origin above: sprites
 * come from the project's GitHub repo, not the API host.
 */
export const SPRITE_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Pokémon per page of the infinite list - 12 rows of the two-column grid. */
export const PAGE_SIZE = 24;

// A hung socket must not pin a query in its loading state forever, so every
// request is aborted after this long and surfaces as a normal, retryable error.
export const REQUEST_TIMEOUT_MS = 15000;

// All 18 at once would peak memory and queue the list's next page behind them.
export const TYPE_FETCH_CONCURRENCY = 6;

/**
 * Cap on rendered search hits. The index holds ~1300 names, and a one-letter
 * query matches hundreds of them; nobody scrolls past the first screenful.
 */
export const SEARCH_RESULT_LIMIT = 60;
