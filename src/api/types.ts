/** Minimal PokeAPI shapes, limited to the fields this app consumes. */

export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  results: NamedAPIResource[];
}

export interface TypeResponse {
  pokemon: { slot: number; pokemon: NamedAPIResource }[];
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedAPIResource;
}

export interface PokemonStat {
  base_stat: number;
  stat: NamedAPIResource;
}

export interface PokemonMove {
  move: NamedAPIResource;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  /** Decimetres */
  height: number;
  /** Hectograms */
  weight: number;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  moves: PokemonMove[];
  sprites: PokemonSprites;
}

export interface MoveEffectEntry {
  effect: string;
  short_effect: string;
  language: NamedAPIResource;
}

export interface Move {
  id: number;
  name: string;
  /** Percentage, or null for moves that never miss. */
  accuracy: number | null;
  /** Null for status moves without direct damage. */
  power: number | null;
  pp: number | null;
  effect_chance: number | null;
  type: NamedAPIResource;
  damage_class: NamedAPIResource | null;
  effect_entries: MoveEffectEntry[];
}

/** Lightweight list entry with the id already extracted from the resource URL. */
export interface PokemonSummary {
  id: number;
  name: string;
}

/** A member of a type's roster, carrying which slot that type occupies for it. */
export interface TypeMember extends PokemonSummary {
  /** 1 for a Pokémon's primary type, 2 for its secondary type. */
  slot: number;
}

/**
 * The 18 canonical Pokémon types — the single source of truth for which types
 * the app fetches, filters on and colors. PokeAPI's `/type` endpoint also
 * returns non-battle entries (`unknown`, `shadow`, `stellar`) that have no color
 * and no members, so the set is pinned here instead of discovered at runtime:
 * every type in the app is one this list and the type-color map both know.
 */
export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];
