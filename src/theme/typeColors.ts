import type { PokemonType } from '@/api/types';

// Typed against `PokemonType` so a missing or stray key is a compile error.
const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

/** Neutral grey for a type or stat key the API sends that we don't have a colour for. */
const FALLBACK_COLOR = '#8A8FA3';

export function typeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase() as PokemonType] ?? FALLBACK_COLOR;
}

// Memoised because every chip asks the same question of the same 18 colours,
// and a grid can hold dozens of chips that re-render on every scroll batch.
const foregroundCache = new Map<string, string>();

/**
 * Picks a readable text color for a given background so light chips
 * (electric, ice, ground, etc.) don't end up with unreadable white text.
 */
export function textColorOn(background: string): string {
  const cached = foregroundCache.get(background);
  if (cached) return cached;

  const hex = background.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Perceived luminance (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const foreground = luminance > 0.6 ? '#1B2137' : '#FFFFFF';

  foregroundCache.set(background, foreground);
  return foreground;
}

/**
 * One fixed colour per stat row, keyed by the raw PokéAPI stat name.
 *
 * Colouring by which stat it is rather than by how large the value is keeps a
 * row's colour stable across Pokémon, so the six bars stay readable as six
 * distinct stats. Grading by value instead would render a whole early-route
 * Pokémon in a single band - Bulbasaur's stats top out at 65 - and lose that.
 */
const STAT_COLORS: Record<string, string> = {
  hp: '#5FBD58',
  attack: '#EC6A5E',
  defense: '#F2B450',
  'special-attack': '#5B9DEF',
  'special-defense': '#4EC5B0',
  speed: '#EF8C50',
};

/** Colour for a base-stat bar, e.g. `special-attack` → blue. */
export function statColor(stat: string): string {
  return STAT_COLORS[stat.toLowerCase()] ?? FALLBACK_COLOR;
}
