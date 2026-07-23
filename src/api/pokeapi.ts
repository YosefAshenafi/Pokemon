import { idFromUrl } from '@/utils/format';

import { POKEMON_TYPES } from './types';
import type {
  Move,
  NamedAPIResource,
  Pokemon,
  PokemonListResponse,
  PokemonSummary,
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

/** All Pokémon that belong to a given type, in National Dex order. */
export async function getPokemonByType(type: string): Promise<PokemonSummary[]> {
  const key = type.trim().toLowerCase();
  const data = await fetchJson<TypeResponse>(
    `/type/${encodeURIComponent(key)}`,
    'Type not found.',
  );
  return toSummaries(data.pokemon.map((entry) => entry.pokemon)).sort((a, b) => a.id - b.id);
}

/** The current list of type names from PokeAPI, so newly added types are discovered. */
async function getTypeNames(): Promise<string[]> {
  const data = await fetchJson<{ results: NamedAPIResource[] }>('/type');
  return data.results.map((entry) => entry.name);
}

/**
 * A `name -> [type, ...]` map for the whole Pokédex, built by reading each type
 * endpoint once (in slot order, so dual types read primary-then-secondary). This
 * lets list cards show their type chips without each one fetching a full ~200 KB
 * Pokémon detail — the N+1 that made deep infinite scroll crawl.
 *
 * The type set is fetched from PokeAPI so a newly added type is picked up
 * automatically, falling back to the built-in `POKEMON_TYPES` when that lookup
 * fails. A single failing type is skipped rather than failing the whole map.
 */
export async function getPokemonTypeIndex(): Promise<Record<string, string[]>> {
  const typeNames = await getTypeNames().catch(() => [...POKEMON_TYPES]);

  const responses = await Promise.all(
    typeNames.map((type) =>
      fetchJson<TypeResponse>(`/type/${type}`, 'Type not found.')
        .then((data) => ({ type, data }))
        .catch(() => null),
    ),
  );

  const slotted: Record<string, { slot: number; type: string }[]> = {};
  for (const response of responses) {
    if (!response) continue;
    for (const entry of response.data.pokemon) {
      (slotted[entry.pokemon.name] ??= []).push({ slot: entry.slot, type: response.type });
    }
  }

  const index: Record<string, string[]> = {};
  for (const name in slotted) {
    index[name] = slotted[name].sort((a, b) => a.slot - b.slot).map((s) => s.type);
  }
  return index;
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
