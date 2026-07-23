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

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

const PAGE_SIZE = 24;

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
): Promise<{ pokemon: PokemonSummary[]; count: number; nextOffset: number | null }> {
  const data = await fetchJson<PokemonListResponse>(`/pokemon?offset=${offset}&limit=${PAGE_SIZE}`);
  const nextOffset = data.next ? offset + PAGE_SIZE : null;
  return { pokemon: toSummaries(data.results), count: data.count, nextOffset };
}

/** Full detail for a single Pokémon by name or numeric id. */
export function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const key = String(nameOrId).trim().toLowerCase();
  return fetchJson<Pokemon>(`/pokemon/${encodeURIComponent(key)}`);
}

/**
 * All Pokémon of a type, in National Dex order. The slot is kept so the type
 * index can be built from these same responses rather than refetching them.
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

// All 18 at once would peak memory and queue the list's next page behind them.
const TYPE_FETCH_CONCURRENCY = 6;

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
 * their chips without each fetching a ~200 KB detail — the N+1 that made deep
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
