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
