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
  PokemonType,
  TypeMember,
} from './types';

/** Why a request failed, as data the UI can branch on. */
export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'unreadable' | 'contract';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    message: string,
    options: {
      kind: ApiErrorKind;
      status?: number;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
  }
}

/** Network and timeout failures are the user's connection, not ours - not reported. */
export function isReportableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.kind !== 'network' && error.kind !== 'timeout';
}

/** Fetches a PokeAPI path and validates the body against `schema`. */
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

/** All Pokémon of a type, in National Dex order. */
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

/** A `name -> types` map for the whole Pokédex. */
export type PokemonTypeIndex = Record<string, PokemonType[]>;

function toIndex(slotted: Map<string, { slot: number; type: PokemonType }[]>): PokemonTypeIndex {
  const index: PokemonTypeIndex = Object.create(null);
  for (const [name, slots] of slotted) {
    index[name] = [...slots].sort((a, b) => a.slot - b.slot).map((entry) => entry.type);
  }
  return index;
}

/** Builds the type index from each type's roster; rejects only if every type fails. */
export async function buildPokemonTypeIndex(
  loadType: (type: string) => Promise<TypeMember[]>,
  onProgress?: (index: PokemonTypeIndex) => void,
): Promise<PokemonTypeIndex> {
  const slotted = new Map<string, { slot: number; type: PokemonType }[]>();
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

/** The complete name index (~1300 entries) used for client-side search. */
export async function getAllPokemonNames(): Promise<PokemonSummary[]> {
  const data = await fetchJson('/pokemon?offset=0&limit=100000', pokemonListResponseSchema);
  return toSummaries(data.results);
}
