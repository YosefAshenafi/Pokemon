/**
 * Minimal PokeAPI shapes, limited to the fields this app consumes. Only the
 * types a consumer names are exported; the nested field shapes stay local.
 */

interface NamedAPIResource {
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

interface PokemonSprites {
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
  types: { slot: number; type: NamedAPIResource }[];
  stats: { base_stat: number; stat: NamedAPIResource }[];
  moves: { move: NamedAPIResource }[];
  sprites: PokemonSprites;
}

interface MoveEffectEntry {
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

/** A type's roster entry. `slot` is 1 for a primary type, 2 for a secondary. */
export interface TypeMember extends PokemonSummary {
  slot: number;
}

/**
 * The types the app fetches, filters on and colors. Pinned rather than read
 * from `/type`, which also returns memberless non-battle entries (`unknown`,
 * `shadow`, `stellar`) that no type-color map would cover.
 */
export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];
