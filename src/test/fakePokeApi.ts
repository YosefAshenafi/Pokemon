/**
 * A fake PokeAPI *server*, installed at the `globalThis.fetch` boundary.
 *
 * This is the only seam the test suite fakes. Everything above it runs for
 * real: `src/api/pokeapi.ts`, every hook, React Query, the Expo Router stack
 * and all components. Nothing under `src/` is ever `jest.mock`ed — swapping the
 * network is the equivalent of pointing an integration suite at a test server
 * rather than production.
 *
 * It serves a 31-entry dex in National Dex order, so that with the client's
 * PAGE_SIZE of 24 there are exactly two pages and pagination is observable.
 */

const BASE = 'https://pokeapi.co/api/v2';
const SPRITES =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

interface DexEntry {
  id: number;
  name: string;
  types: string[];
  /** Decimetres, as PokeAPI reports it. */
  height: number;
  /** Hectograms, as PokeAPI reports it. */
  weight: number;
  /** hp, attack, defense, special-attack, special-defense, speed */
  stats: [number, number, number, number, number, number];
  moves: string[];
  /** Mega/gmax forms have no official artwork; some have no sprite at all. */
  artwork?: boolean;
  sprite?: boolean;
}

const BASIC_MOVES = ['tackle', 'growl', 'scratch', 'ember'];

/** Enough moves to push a Pokémon past the detail screen's 8-move preview. */
const MANY_MOVES = [
  'razor-wind', 'swords-dance', 'cut', 'bind', 'vine-whip', 'headbutt',
  'tackle', 'body-slam', 'take-down', 'double-edge', 'growl', 'strength',
];

export const DEX: DexEntry[] = [
  { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], height: 7, weight: 69, stats: [45, 49, 49, 65, 65, 45], moves: MANY_MOVES },
  { id: 2, name: 'ivysaur', types: ['grass', 'poison'], height: 10, weight: 130, stats: [60, 62, 63, 80, 80, 60], moves: BASIC_MOVES },
  { id: 3, name: 'venusaur', types: ['grass', 'poison'], height: 20, weight: 1000, stats: [80, 82, 83, 100, 100, 80], moves: BASIC_MOVES },
  { id: 4, name: 'charmander', types: ['fire'], height: 6, weight: 85, stats: [39, 52, 43, 60, 50, 65], moves: BASIC_MOVES },
  { id: 5, name: 'charmeleon', types: ['fire'], height: 11, weight: 190, stats: [58, 64, 58, 80, 65, 80], moves: BASIC_MOVES },
  { id: 6, name: 'charizard', types: ['fire', 'flying'], height: 17, weight: 905, stats: [78, 84, 78, 109, 85, 100], moves: BASIC_MOVES },
  { id: 7, name: 'squirtle', types: ['water'], height: 5, weight: 90, stats: [44, 48, 65, 50, 64, 43], moves: BASIC_MOVES },
  { id: 8, name: 'wartortle', types: ['water'], height: 10, weight: 225, stats: [59, 63, 80, 65, 80, 58], moves: BASIC_MOVES },
  { id: 9, name: 'blastoise', types: ['water'], height: 16, weight: 855, stats: [79, 83, 100, 85, 105, 78], moves: BASIC_MOVES },
  { id: 10, name: 'caterpie', types: ['bug'], height: 3, weight: 29, stats: [45, 30, 35, 20, 20, 45], moves: BASIC_MOVES },
  { id: 11, name: 'metapod', types: ['bug'], height: 7, weight: 99, stats: [50, 20, 55, 25, 25, 30], moves: BASIC_MOVES },
  { id: 12, name: 'butterfree', types: ['bug', 'flying'], height: 11, weight: 320, stats: [60, 45, 50, 90, 80, 70], moves: BASIC_MOVES },
  { id: 13, name: 'weedle', types: ['bug', 'poison'], height: 3, weight: 32, stats: [40, 35, 30, 20, 20, 50], moves: BASIC_MOVES },
  { id: 14, name: 'kakuna', types: ['bug', 'poison'], height: 6, weight: 100, stats: [45, 25, 50, 25, 25, 35], moves: BASIC_MOVES },
  { id: 15, name: 'beedrill', types: ['bug', 'poison'], height: 10, weight: 295, stats: [65, 90, 40, 45, 80, 75], moves: BASIC_MOVES },
  { id: 16, name: 'pidgey', types: ['normal', 'flying'], height: 3, weight: 18, stats: [40, 45, 40, 35, 35, 56], moves: BASIC_MOVES },
  { id: 17, name: 'pidgeotto', types: ['normal', 'flying'], height: 11, weight: 300, stats: [63, 60, 55, 50, 50, 71], moves: BASIC_MOVES },
  { id: 18, name: 'pidgeot', types: ['normal', 'flying'], height: 15, weight: 395, stats: [83, 80, 75, 70, 70, 101], moves: BASIC_MOVES },
  { id: 19, name: 'rattata', types: ['normal'], height: 3, weight: 35, stats: [30, 56, 35, 25, 35, 72], moves: BASIC_MOVES },
  { id: 20, name: 'raticate', types: ['normal'], height: 7, weight: 185, stats: [55, 81, 60, 50, 70, 97], moves: BASIC_MOVES },
  { id: 21, name: 'spearow', types: ['normal', 'flying'], height: 3, weight: 20, stats: [40, 60, 30, 31, 31, 70], moves: BASIC_MOVES },
  { id: 22, name: 'fearow', types: ['normal', 'flying'], height: 12, weight: 380, stats: [65, 90, 65, 61, 61, 100], moves: BASIC_MOVES },
  { id: 23, name: 'ekans', types: ['poison'], height: 20, weight: 69, stats: [35, 60, 44, 40, 54, 55], moves: BASIC_MOVES },
  { id: 24, name: 'arbok', types: ['poison'], height: 35, weight: 650, stats: [60, 95, 69, 65, 79, 80], moves: BASIC_MOVES },
  // Page 2 starts here.
  { id: 25, name: 'pikachu', types: ['electric'], height: 4, weight: 60, stats: [35, 55, 40, 50, 50, 90], moves: MANY_MOVES },
  { id: 26, name: 'raichu', types: ['electric'], height: 8, weight: 300, stats: [60, 90, 55, 90, 80, 110], moves: BASIC_MOVES },
  { id: 27, name: 'sandshrew', types: ['ground'], height: 6, weight: 120, stats: [50, 75, 85, 20, 30, 40], moves: BASIC_MOVES },
  { id: 28, name: 'sandslash', types: ['ground'], height: 10, weight: 295, stats: [75, 100, 110, 45, 55, 65], moves: BASIC_MOVES },
  { id: 29, name: 'nidoran-f', types: ['poison'], height: 4, weight: 70, stats: [55, 47, 52, 40, 40, 41], moves: BASIC_MOVES },
  { id: 30, name: 'nidorina', types: ['poison'], height: 8, weight: 200, stats: [70, 62, 67, 55, 55, 56], moves: BASIC_MOVES },
  // A mega form: ids above 10000 have no official artwork, only a sprite.
  { id: 10033, name: 'venusaur-mega', types: ['grass', 'poison'], height: 24, weight: 1555, stats: [80, 100, 123, 122, 120, 80], moves: BASIC_MOVES, artwork: false },
  // A form with neither artwork nor sprite, so the pokéball placeholder shows.
  { id: 10034, name: 'charizard-mega-x', types: ['fire', 'dragon'], height: 17, weight: 1105, stats: [78, 130, 111, 130, 85, 100], moves: BASIC_MOVES, artwork: false, sprite: false },
];

const STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

interface MoveFixture {
  id: number;
  type: string;
  damageClass: string | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effectChance: number | null;
  effect: string;
  /** Defaults to English; set to another language to exercise the fallback. */
  language?: string;
  /** Some older moves carry no effect text at all. */
  noEffectEntries?: boolean;
}

const MOVE_DATA: Record<string, MoveFixture> = {
  tackle: { id: 33, type: 'normal', damageClass: 'physical', power: 40, accuracy: 100, pp: 35, effectChance: null, effect: 'Deals damage with no additional effect.' },
  growl: { id: 45, type: 'normal', damageClass: 'status', power: null, accuracy: 100, pp: 40, effectChance: null, effect: "Lowers the target's Attack by one stage." },
  ember: { id: 52, type: 'fire', damageClass: 'special', power: 40, accuracy: 100, pp: 25, effectChance: 10, effect: 'Has a $effect_chance% chance to burn the target.' },
  'vine-whip': { id: 22, type: 'grass', damageClass: 'physical', power: 45, accuracy: 100, pp: 25, effectChance: null, effect: 'Inflicts regular damage.' },
  // A move that never misses and has no damage class, exercising the em-dash paths.
  swift: { id: 129, type: 'normal', damageClass: null, power: 60, accuracy: null, pp: 20, effectChance: null, effect: 'Never misses.' },
  // Unlimited PP, so every fact box can be blank at once.
  struggle: { id: 165, type: 'normal', damageClass: 'physical', power: null, accuracy: null, pp: null, effectChance: null, effect: 'Used when out of PP.' },
  // No English entry, so the screen must fall back to the first one there is.
  'karate-chop': { id: 2, type: 'fighting', damageClass: 'physical', power: 50, accuracy: 100, pp: 25, effectChance: null, effect: '急所に当たりやすい。', language: 'ja' },
  // No effect text at all, so the Effect card must be omitted entirely.
  'mystery-move': { id: 999, type: 'normal', damageClass: 'physical', power: 30, accuracy: 90, pp: 15, effectChance: null, effect: '', noEffectEntries: true },
};

function moveEntry(name: string) {
  return MOVE_DATA[name] ?? { id: 999, type: 'normal', damageClass: 'physical', power: 50, accuracy: 95, pp: 20, effectChance: null, effect: `Placeholder effect for ${name}.` };
}

function pokemonResource(entry: DexEntry) {
  return { name: entry.name, url: `${BASE}/pokemon/${entry.id}/` };
}

function pokemonDetail(entry: DexEntry) {
  return {
    id: entry.id,
    name: entry.name,
    height: entry.height,
    weight: entry.weight,
    types: entry.types.map((type, i) => ({ slot: i + 1, type: { name: type, url: `${BASE}/type/${type}/` } })),
    stats: entry.stats.map((base_stat, i) => ({ base_stat, stat: { name: STAT_NAMES[i], url: `${BASE}/stat/${i + 1}/` } })),
    moves: entry.moves.map((name) => ({ move: { name, url: `${BASE}/move/${moveEntry(name).id}/` } })),
    sprites: {
      front_default: entry.sprite === false ? null : `${SPRITES}/${entry.id}.png`,
      other: {
        'official-artwork': {
          front_default: entry.artwork === false ? null : `${SPRITES}/other/official-artwork/${entry.id}.png`,
        },
      },
    },
  };
}

function moveDetail(name: string) {
  const move = moveEntry(name);
  return {
    id: move.id,
    name,
    accuracy: move.accuracy,
    power: move.power,
    pp: move.pp,
    effect_chance: move.effectChance,
    type: { name: move.type, url: `${BASE}/type/${move.type}/` },
    damage_class: move.damageClass ? { name: move.damageClass, url: `${BASE}/move-damage-class/1/` } : null,
    effect_entries: move.noEffectEntries
      ? []
      : [
          {
            effect: move.effect,
            short_effect: move.effect,
            language: { name: move.language ?? 'en', url: `${BASE}/language/9/` },
          },
        ],
  };
}

export interface FakePokeApi {
  /** Every URL the app requested, in order. */
  requests: string[];
  /** When true, every request rejects the way a dead connection does. */
  offline: boolean;
  /** `/type/<name>` requests for these types respond 500. */
  failingTypes: Set<string>;
  /** Any request whose URL contains one of these responds 404. */
  missing: Set<string>;
  /** Requests matching these resolve only when `release()` is called. */
  hold: Set<string>;
  release(): void;
  restore(): void;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/**
 * Installs the fake server on `globalThis.fetch` and returns a handle for
 * steering it (going offline, failing a type, holding a response open).
 */
export function installFakePokeApi(): FakePokeApi {
  const originalFetch = globalThis.fetch;
  const pending: (() => void)[] = [];

  const api: FakePokeApi = {
    requests: [],
    offline: false,
    failingTypes: new Set(),
    missing: new Set(),
    hold: new Set(),
    release() {
      const waiting = pending.splice(0, pending.length);
      waiting.forEach((resolve) => resolve());
    },
    restore() {
      globalThis.fetch = originalFetch;
    },
  };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    api.requests.push(url);

    if (api.offline) throw new TypeError('Network request failed');

    if ([...api.hold].some((fragment) => url.includes(fragment))) {
      await new Promise<void>((resolve) => pending.push(resolve));
    }
    if ([...api.missing].some((fragment) => url.includes(fragment))) {
      return jsonResponse({ detail: 'Not found.' }, 404);
    }

    const path = url.replace(`${BASE}/`, '');

    // /pokemon?offset=N&limit=M — the paginated dex and the full name index.
    const listMatch = /^pokemon\?offset=(\d+)&limit=(\d+)$/.exec(path);
    if (listMatch) {
      const offset = Number(listMatch[1]);
      const limit = Number(listMatch[2]);
      const slice = DEX.slice(offset, offset + limit);
      return jsonResponse({
        count: DEX.length,
        next: offset + limit < DEX.length ? `${BASE}/pokemon?offset=${offset + limit}&limit=${limit}` : null,
        results: slice.map(pokemonResource),
      });
    }

    // /type/<name>
    const typeMatch = /^type\/([^/?]+)$/.exec(path);
    if (typeMatch) {
      const type = decodeURIComponent(typeMatch[1]);
      if (api.failingTypes.has(type)) return jsonResponse({ detail: 'boom' }, 500);
      const members = DEX.filter((entry) => entry.types.includes(type));
      if (members.length === 0) return jsonResponse({ detail: 'Not found.' }, 404);
      return jsonResponse({
        // Deliberately unsorted, so the client's own id sort is what orders it.
        pokemon: [...members].reverse().map((entry) => ({
          slot: entry.types.indexOf(type) + 1,
          pokemon: pokemonResource(entry),
        })),
      });
    }

    // /pokemon/<name-or-id>
    const detailMatch = /^pokemon\/([^/?]+)$/.exec(path);
    if (detailMatch) {
      const key = decodeURIComponent(detailMatch[1]);
      const entry = DEX.find((e) => e.name === key || String(e.id) === key);
      return entry ? jsonResponse(pokemonDetail(entry)) : jsonResponse({ detail: 'Not found.' }, 404);
    }

    // /move/<name>
    const moveMatch = /^move\/([^/?]+)$/.exec(path);
    if (moveMatch) {
      const key = decodeURIComponent(moveMatch[1]);
      return jsonResponse(moveDetail(key));
    }

    return jsonResponse({ detail: `Unhandled path: ${path}` }, 404);
  }) as typeof fetch;

  return api;
}

/** The dex entries a `/type/<type>` roster contains, in the order the app shows them. */
export function dexByType(...types: string[]): DexEntry[] {
  return DEX.filter((entry) => types.every((type) => entry.types.includes(type)));
}
