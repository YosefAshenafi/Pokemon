import { idFromUrl } from '@/utils/format';

import { POKEMON_TYPES } from './types';
import type {
  Move,
  Pokemon,
  PokemonListResponse,
  PokemonSummary,
  TypeMember,
  TypeResponse,
} from './types';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export const PAGE_SIZE = 24;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(path: string, notFoundMessage = 'Pokémon not found.'): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${POKEAPI_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError('Network request failed. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new ApiError(
      response.status === 404 ? notFoundMessage : `PokeAPI request failed (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

function toSummaries(results: PokemonListResponse['results']): PokemonSummary[] {
  return results.flatMap((entry) => {
    const id = idFromUrl(entry.url);
    return id === null ? [] : [{ id, name: entry.name }];
  });
}

/** One page of the Pokédex, in National Dex order. */
export async function getPokemonPage(
  offset: number,
  limit: number = PAGE_SIZE,
): Promise<{ pokemon: PokemonSummary[]; count: number; nextOffset: number | null }> {
  const data = await fetchJson<PokemonListResponse>(`/pokemon?offset=${offset}&limit=${limit}`);
  const nextOffset = data.next ? offset + limit : null;
  return { pokemon: toSummaries(data.results), count: data.count, nextOffset };
}

/** Full detail for a single Pokémon by name or numeric id. */
export function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const key = String(nameOrId).trim().toLowerCase();
  return fetchJson<Pokemon>(`/pokemon/${encodeURIComponent(key)}`);
}

/**
 * All Pokémon that belong to a given type, in National Dex order, each tagged
 * with the slot that type occupies for it. The slot is what lets the type index
 * (below) be built from these same responses instead of downloading every type
 * endpoint a second time.
 */
export async function getPokemonByType(type: string): Promise<TypeMember[]> {
  const key = type.trim().toLowerCase();
  const data = await fetchJson<TypeResponse>(
    `/type/${encodeURIComponent(key)}`,
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

/**
 * How many type endpoints are read at once. PokeAPI type responses are large,
 * and Android's HTTP client only allows ~5 concurrent connections per host, so
 * firing all 18 at once would both peak memory and push the list's next page
 * behind them. Batching keeps the index build from starving infinite scroll.
 */
const TYPE_FETCH_CONCURRENCY = 6;

function toIndex(slotted: Map<string, { slot: number; type: string }[]>): PokemonTypeIndex {
  // Null-prototype: names come from the API, so a Pokémon called `__proto__` or
  // `constructor` must not collide with anything inherited from Object.
  const index: PokemonTypeIndex = Object.create(null);
  for (const [name, slots] of slotted) {
    index[name] = [...slots].sort((a, b) => a.slot - b.slot).map((entry) => entry.type);
  }
  return index;
}

/**
 * Builds the type index by reading each type's roster once, in slot order so
 * dual types read primary-then-secondary. This is what lets list cards show
 * their type chips without each one fetching a full ~200 KB Pokémon detail —
 * the N+1 that made deep infinite scroll crawl.
 *
 * `loadType` is injected so the caller can serve (and seed) the same cache the
 * type filter uses, keeping it to one request per type for the whole session.
 * `onProgress` receives the index so far after each batch, so chips fill in
 * progressively instead of waiting on the slowest type.
 *
 * A single failing type is skipped, but a run in which *every* type fails
 * rejects rather than resolving with an empty index — resolving would cache and
 * persist "no Pokémon has any type" as if it were a real answer.
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

    const isLastBatch = start + TYPE_FETCH_CONCURRENCY >= POKEMON_TYPES.length;
    // Nothing yet means every type so far failed; publishing `{}` would read as
    // a successful "no types" answer, so hold off until there is real data.
    if (!isLastBatch && slotted.size > 0) onProgress?.(toIndex(slotted));
  }

  if (loaded === 0) {
    throw new ApiError('Pokémon types could not be loaded. Check your connection and try again.');
  }
  return toIndex(slotted);
}

/** Full detail for a single move by name or numeric id. */
export function getMove(nameOrId: string | number): Promise<Move> {
  const key = String(nameOrId).trim().toLowerCase();
  return fetchJson<Move>(`/move/${encodeURIComponent(key)}`, 'Move not found.');
}

/**
 * The complete name index (~1300 entries, a few KB) used for client-side
 * search, since PokeAPI has no substring-search endpoint.
 */
export async function getAllPokemonNames(): Promise<PokemonSummary[]> {
  const data = await fetchJson<PokemonListResponse>('/pokemon?offset=0&limit=100000');
  return toSummaries(data.results);
}
