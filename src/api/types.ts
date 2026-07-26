/**
 * The PokeAPI response contracts, as schemas rather than declarations.
 *
 * These are parsed at the fetch boundary, not asserted with `as`: PokeAPI is a
 * third party, and a declaration that turns out to be wrong surfaces as a crash
 * deep inside a render rather than as an error the screen can show. Each type
 * below is *inferred* from its schema, so the shape the compiler believes and
 * the shape actually validated cannot drift apart.
 *
 * Only the fields this app consumes are modelled. Unlisted keys are stripped,
 * which also keeps a ~200 KB Pokémon detail from being cached whole.
 */
import { z } from 'zod';

const namedResource = z.object({ name: z.string(), url: z.string() });

export const pokemonListResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  results: z.array(namedResource),
});
export type PokemonListResponse = z.infer<typeof pokemonListResponseSchema>;

export const typeResponseSchema = z.object({
  pokemon: z.array(z.object({ slot: z.number(), pokemon: namedResource })),
});
export type TypeResponse = z.infer<typeof typeResponseSchema>;

export const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  /** Decimetres */
  height: z.number(),
  /** Hectograms */
  weight: z.number(),
  types: z.array(z.object({ slot: z.number(), type: namedResource })),
  stats: z.array(z.object({ base_stat: z.number(), stat: namedResource })),
  moves: z.array(z.object({ move: namedResource })),
  sprites: z.object({
    front_default: z.string().nullable(),
    other: z
      .object({
        'official-artwork': z.object({ front_default: z.string().nullable() }).optional(),
      })
      .optional(),
  }),
});
export type Pokemon = z.infer<typeof pokemonSchema>;

export const moveSchema = z.object({
  id: z.number(),
  name: z.string(),
  /** Percentage, or null for moves that never miss. */
  accuracy: z.number().nullable(),
  /** Null for status moves without direct damage. */
  power: z.number().nullable(),
  pp: z.number().nullable(),
  effect_chance: z.number().nullable(),
  type: namedResource,
  damage_class: namedResource.nullable(),
  effect_entries: z.array(
    z.object({ effect: z.string(), short_effect: z.string(), language: namedResource }),
  ),
});
export type Move = z.infer<typeof moveSchema>;

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
