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
  height: z.number(),
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
  accuracy: z.number().nullable(),
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

export interface PokemonSummary {
  id: number;
  name: string;
}

export interface TypeMember extends PokemonSummary {
  slot: number;
}

export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];
