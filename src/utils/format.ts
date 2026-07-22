/** `1` → `#001`, `1025` → `#1025` */
export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

/** `"mr-mime"` → `"Mr Mime"` */
export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

/** PokeAPI height is in decimetres. `7` → `"0.7 m"` */
export function formatHeightMeters(decimetres: number): string {
  return `${(decimetres / 10).toFixed(1)} m`;
}

/** `7` (dm) → `"2'04\""` */
export function formatHeightFeetInches(decimetres: number): string {
  const totalInches = decimetres * 3.93701;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return `${feet}'${String(inches).padStart(2, '0')}"`;
}

/** PokeAPI weight is in hectograms. `69` → `"6.9 kg"` */
export function formatWeightKg(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`;
}

/** `69` (hg) → `"15.2 lbs"` */
export function formatWeightLbs(hectograms: number): string {
  return `${(hectograms * 0.220462).toFixed(1)} lbs`;
}

/** Extracts the trailing id from a PokeAPI resource URL, or null. */
export function idFromUrl(url: string): number | null {
  const match = /\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : null;
}

/** High-res official artwork hosted by the PokeAPI sprites repo. */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/** Small default sprite, the fallback for forms without official artwork. */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/** Fills PokeAPI's `$effect_chance` placeholder in move effect text. */
export function formatEffectText(text: string, effectChance: number | null): string {
  if (effectChance === null) return text;
  return text.replace(/\$effect_chance/g, String(effectChance));
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

export function formatStatName(stat: string): string {
  return STAT_LABELS[stat] ?? formatName(stat);
}
