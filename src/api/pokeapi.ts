import type { z } from 'zod';

import {
  PAGE_SIZE,
  POKEAPI_BASE_URL,
  REQUEST_TIMEOUT_MS,
  TYPE_FETCH_CONCURRENCY,
} from '@/constants/api';
import { idFromUrl } from '@/utils/format';

import {
  POKEMON_TYPES,
  moveSchema,
  pokemonListResponseSchema,
  pokemonSchema,
  typeResponseSchema,
} from './types';
import type {
  Move,
  Pokemon,
  PokemonListResponse,
  PokemonSummary,
  TypeMember,
} from './types';

/**
 * Why a request failed, as data rather than as prose.
 *
 * The distinction that matters downstream is whether a failure says something
 * about *us*: `network` and `timeout` mean a user is on a train, and there are
 * millions of those; `contract` and `unreadable` mean the API changed under us
 * and somebody needs to know today.
 */
export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'unreadable' | 'contract';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    message: string,
    options: {
      kind: ApiErrorKind;
      status?: number;
      /** The underlying failure, kept so a report carries more than our wording. */
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
  }
}

/**
 * Whether a failure is worth reporting. A dropped connection is the user's
 * network telling us nothing we can act on, and the type index alone would
 * send nineteen of them from a single offline launch.
 */
export function isReportableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.kind !== 'network' && error.kind !== 'timeout';
}

/**
 * The single choke point every request passes through. Callers pass only a
 * path, never a full URL, so the HTTPS origin above is the only host this client
 * can ever reach; all interpolated segments are `encodeURIComponent`-escaped by
 * the callers so a name can never break out of its path.
 *
 * The body is *parsed* against `schema` rather than cast. A third party can
 * change a field without telling us, and an unchecked cast turns that into a
 * crash inside a render; parsing turns it into an ordinary, retryable error
 * that the screen already knows how to show, and reports it so we hear about
 * it before a user does.
 */
async function fetchJson<T>(
  path: string,
  schema: z.ZodType<T>,
  notFoundMessage = 'Pokémon not found.',
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(`${POKEAPI_BASE_URL}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (cause) {
      const timedOut = controller.signal.aborted;
      throw new ApiError(
        timedOut
          ? 'The request timed out. Check your connection and try again.'
          : 'Network request failed. Check your connection and try again.',
        { kind: timedOut ? 'timeout' : 'network', cause },
      );
    }

    if (!response.ok) {
      throw new ApiError(
        response.status === 404 ? notFoundMessage : `PokeAPI request failed (${response.status}).`,
        { kind: 'http', status: response.status },
      );
    }

    // A 200 carrying a proxy's HTML error page parses as a SyntaxError, not a
    // network failure. Converting it here keeps every failure out of this
    // client shaped like an ApiError, so no caller has to render a raw one.
    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new ApiError('The server sent a response that could not be read.', {
        kind: 'unreadable',
        cause,
      });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('The server sent data in an unexpected format.', {
        kind: 'contract',
        cause: parsed.error,
      });
    }
    return parsed.data;
  } finally {
    clearTimeout(timeout);
  }
}

function toSummaries(results: PokemonListResponse['results']): PokemonSummary[] {
  return results.flatMap((entry) => {
    const id = idFromUrl(entry.url);
    return id === null ? [] : [{ id, name: entry.name }];
  });
}

/** One page of the Pokédex, with the offset the next page starts at. */
export interface PokemonPage {
  pokemon: PokemonSummary[];
  count: number;
  /** `null` once the Pokédex has no further pages. */
  nextOffset: number | null;
}

/** One page of the Pokédex, in National Dex order. */
export async function getPokemonPage(offset: number): Promise<PokemonPage> {
  const data = await fetchJson(
    `/pokemon?offset=${offset}&limit=${PAGE_SIZE}`,
    pokemonListResponseSchema,
  );
  const nextOffset = data.next ? offset + PAGE_SIZE : null;
  return { pokemon: toSummaries(data.results), count: data.count, nextOffset };
}

/** Full detail for a single Pokémon by name or numeric id. */
export function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const key = String(nameOrId).trim().toLowerCase();
  return fetchJson(`/pokemon/${encodeURIComponent(key)}`, pokemonSchema);
}

/**
 * All Pokémon of a type, in National Dex order. The slot is kept so the type
 * index can be built from these same responses rather than refetching them.
 */
export async function getPokemonByType(type: string): Promise<TypeMember[]> {
  const key = type.trim().toLowerCase();
  const data = await fetchJson(
    `/type/${encodeURIComponent(key)}`,
    typeResponseSchema,
    'Type not found.',
  );
  return data.pokemon
    .flatMap(({ slot, pokemon }) => {
      const id = idFromUrl(pokemon.url);
      return id === null ? [] : [{ id, name: pokemon.name, slot }];
    })
    .sort((a, b) => a.id - b.id);
}

/** A `name -> [type, ...]` map for the whole Pokédex, in slot order. */
export type PokemonTypeIndex = Record<string, string[]>;

function toIndex(slotted: Map<string, { slot: number; type: string }[]>): PokemonTypeIndex {
  // Null-prototype, so an API name like `__proto__` can't hit an inherited key.
  const index: PokemonTypeIndex = Object.create(null);
  for (const [name, slots] of slotted) {
    index[name] = [...slots].sort((a, b) => a.slot - b.slot).map((entry) => entry.type);
  }
  return index;
}

/**
 * Builds the type index by reading each type's roster once, so list cards get
 * their chips without each fetching a ~200 KB detail - the N+1 that made deep
 * infinite scroll crawl. `loadType` is injected so the caller can serve it from
 * the same cache the type filter uses; `onProgress` reports the index so far.
 *
 * One failing type is skipped, but a run where *every* type fails rejects: an
 * empty index would be cached and persisted as if it were a real answer.
 */
export async function buildPokemonTypeIndex(
  loadType: (type: string) => Promise<TypeMember[]>,
  onProgress?: (index: PokemonTypeIndex) => void,
): Promise<PokemonTypeIndex> {
  const slotted = new Map<string, { slot: number; type: string }[]>();
  let loaded = 0;

  for (let start = 0; start < POKEMON_TYPES.length; start += TYPE_FETCH_CONCURRENCY) {
    const batch = POKEMON_TYPES.slice(start, start + TYPE_FETCH_CONCURRENCY);
    const results = await Promise.all(
      batch.map((type) =>
        loadType(type)
          .then((members) => ({ type, members }))
          .catch(() => null),
      ),
    );

    for (const result of results) {
      if (!result) continue;
      loaded += 1;
      for (const member of result.members) {
        const slots = slotted.get(member.name);
        if (slots) slots.push({ slot: member.slot, type: result.type });
        else slotted.set(member.name, [{ slot: member.slot, type: result.type }]);
      }
    }

    // An empty map means every type so far failed; reporting it would read as a
    // successful "no types" answer, so wait for real data.
    const isLastBatch = start + TYPE_FETCH_CONCURRENCY >= POKEMON_TYPES.length;
    if (!isLastBatch && slotted.size > 0) onProgress?.(toIndex(slotted));
  }

  if (loaded === 0) {
    throw new ApiError('Pokémon types could not be loaded. Check your connection and try again.', {
      kind: 'network',
    });
  }
  return toIndex(slotted);
}

/** Full detail for a single move by name or numeric id. */
export function getMove(nameOrId: string | number): Promise<Move> {
  const key = String(nameOrId).trim().toLowerCase();
  return fetchJson(`/move/${encodeURIComponent(key)}`, moveSchema, 'Move not found.');
}

/**
 * The complete name index (~1300 entries, a few KB) used for client-side
 * search, since PokeAPI has no substring-search endpoint.
 */
export async function getAllPokemonNames(): Promise<PokemonSummary[]> {
  const data = await fetchJson('/pokemon?offset=0&limit=100000', pokemonListResponseSchema);
  return toSummaries(data.results);
}
