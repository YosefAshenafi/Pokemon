/** Canonical colors for the 18 Pokémon types, used for type chips and accents. */
export const TYPE_COLORS: Record<string, string> = {
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

const FALLBACK_TYPE_COLOR = '#8A8FA3';

export function typeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? FALLBACK_TYPE_COLOR;
}

/**
 * Picks a readable text color for a given background so light chips
 * (electric, ice, ground…) don't end up with unreadable white text.
 */
export function textColorOn(background: string): string {
  const hex = background.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Perceived luminance (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#1B2137' : '#FFFFFF';
}

/** Color for a base-stat bar: low → red, mid → amber, high → green. */
export function statColor(value: number): string {
  if (value < 50) return '#EC6A5E';
  if (value < 90) return '#F2B450';
  return '#5FBD58';
}
