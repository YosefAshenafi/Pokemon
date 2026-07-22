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

/** Lightweight list entry with the id already extracted from the resource URL. */
export interface PokemonSummary {
  id: number;
  name: string;
}
