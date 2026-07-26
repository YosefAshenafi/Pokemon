import type { PokemonType } from '@/api/types';

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

const FALLBACK_COLOR = '#8A8FA3';

export function typeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase() as PokemonType] ?? FALLBACK_COLOR;
}

function readableOn(background: string): string {
  const hex = background.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#1B2137' : '#FFFFFF';
}

const STAT_COLORS: Record<string, string> = {
  hp: '#5FBD58',
  attack: '#EC6A5E',
  defense: '#F2B450',
  'special-attack': '#5B9DEF',
  'special-defense': '#4EC5B0',
  speed: '#EF8C50',
};

export function statColor(stat: string): string {
  return STAT_COLORS[stat.toLowerCase()] ?? FALLBACK_COLOR;
}

const FOREGROUNDS: Record<string, string> = Object.fromEntries(
  [...Object.values(TYPE_COLORS), ...Object.values(STAT_COLORS), FALLBACK_COLOR].map(
    (background) => [background, readableOn(background)],
  ),
);

/** Readable text colour for a given background. */
export function textColorOn(background: string): string {
  return FOREGROUNDS[background] ?? readableOn(background);
}
