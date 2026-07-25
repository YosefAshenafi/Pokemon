/**
 * Caching and persistence policy. These decide how long an answer is trusted
 * and which storage keys the app owns, so they belong together rather than
 * scattered across the hooks that happen to apply them.
 */

/** How long a persisted query survives on disk before it is treated as expired. */
export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

/** Default freshness for anything without its own policy. */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * For data that cannot change while the app is open - a Pokémon's stats, a
 * type's roster, a move's power. Named rather than written as a bare `Infinity`
 * at each call site so the intent ("never refetch this") is the thing that gets
 * read, and so relaxing the policy is one edit.
 */
export const STATIC_STALE_TIME = Infinity;

/** Retries per failed query before the error surfaces to the screen. */
export const QUERY_RETRY_COUNT = 2;

/** Bump to invalidate every persisted entry after a response shape changes. */
export const CACHE_BUSTER = 'v1';

/** Bump the suffix if the persisted-cache shape changes and old rows must be purged. */
export const CACHE_MIGRATION_KEY = 'cache-migrated-v2';

/**
 * AsyncStorage keys written by earlier builds. The one-time migration removes
 * anything matching these, since the old whole-cache blob could leave the
 * database full on Android.
 */
export const LEGACY_CACHE_KEY = 'pokedex-query-cache';
export const LEGACY_CACHE_KEY_PREFIX = 'tanstack-query';
