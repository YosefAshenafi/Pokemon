import {
  ApiError,
  buildPokemonTypeIndex,
  getMove,
  getPokemon,
  getPokemonByType,
  getPokemonPage,
} from '../pokeapi';
import { POKEMON_TYPES, type TypeMember } from '../types';

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('getPokemonPage', () => {
  it('requests the right page and maps results to summaries with ids', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        count: 1302,
        next: 'https://pokeapi.co/api/v2/pokemon?offset=24&limit=24',
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      }),
    );

    const page = await getPokemonPage(0);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon?offset=0&limit=24',
      expect.anything(),
    );
    expect(page.pokemon).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 2, name: 'ivysaur' },
    ]);
    expect(page.nextOffset).toBe(24);
  });

  it('reports the end of the list with a null nextOffset', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ count: 2, next: null, results: [] }));

    const page = await getPokemonPage(1280);

    expect(page.nextOffset).toBeNull();
  });

  it('skips entries whose resource URL carries no id', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        count: 2,
        next: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'mystery', url: 'https://pokeapi.co/api/v2/pokemon/unknown' },
        ],
      }),
    );

    const page = await getPokemonPage(0);

    expect(page.pokemon).toEqual([{ id: 1, name: 'bulbasaur' }]);
  });
});

describe('getPokemon', () => {
  it('normalizes the name before requesting', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 25, name: 'pikachu' }));

    await getPokemon('  Pikachu ');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/pokemon/pikachu',
      expect.anything(),
    );
  });

  it('throws a friendly ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(getPokemon('missingno')).rejects.toThrow('Pokémon not found.');
  });

  it('wraps network failures in an ApiError', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(getPokemon('pikachu')).rejects.toBeInstanceOf(ApiError);
    await expect(getPokemon('pikachu')).rejects.toThrow(/check your connection/i);
  });
});

describe('request safety', () => {
  it('sends every request to the pinned HTTPS origin only', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 25, name: 'pikachu' }));

    await getPokemon('pikachu');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toMatch(/^https:\/\/pokeapi\.co\/api\/v2\//);
  });

  it('percent-encodes a name so it cannot break out of its path', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404));

    // A path-traversal-style name must stay a single, escaped path segment
    // rather than climbing to another endpoint.
    await expect(getPokemon('../../../secret')).rejects.toBeInstanceOf(ApiError);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://pokeapi.co/api/v2/pokemon/..%2F..%2F..%2Fsecret');
    expect(url).not.toContain('/secret');
  });

  it('escapes a type name before putting it in the path', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(getPokemonByType('fire/../pokemon/1')).rejects.toBeInstanceOf(ApiError);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://pokeapi.co/api/v2/type/fire%2F..%2Fpokemon%2F1');
  });

  it('aborts a request that never responds and reports a timeout', async () => {
    jest.useFakeTimers();
    try {
      // Resolve only if the request is aborted, mimicking a dead socket that
      // hangs until the client gives up.
      mockFetch.mockImplementation(
        (_url: string, options: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted.', 'AbortError')),
            );
          }),
      );

      const pending = getPokemon('pikachu');
      const settled = pending.catch((error) => error);

      await jest.advanceTimersByTimeAsync(15000);

      const error = await settled;
      expect(error).toBeInstanceOf(ApiError);
      expect(String(error)).toMatch(/timed out/i);
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears the timeout once a request succeeds, leaving no pending timers', async () => {
    jest.useFakeTimers();
    try {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 25, name: 'pikachu' }));

      await getPokemon('pikachu');

      // The abort timer was cleared on success, so nothing is left to fire.
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('getPokemonByType', () => {
  it('normalizes the type, keeps each member’s slot, and sorts by id', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        pokemon: [
          { slot: 2, pokemon: { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' } },
          { slot: 1, pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' } },
        ],
      }),
    );

    const members = await getPokemonByType('  Fire ');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/type/fire',
      expect.anything(),
    );
    expect(members).toEqual([
      { id: 4, name: 'charmander', slot: 1 },
      { id: 6, name: 'charizard', slot: 2 },
    ]);
  });

  it('throws a type-specific ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(getPokemonByType('notatype')).rejects.toThrow('Type not found.');
  });

  it('drops members whose resource URL carries no id', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        pokemon: [
          { slot: 1, pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' } },
          { slot: 1, pokemon: { name: 'mystery', url: 'https://pokeapi.co/api/v2/pokemon/' } },
        ],
      }),
    );

    const members = await getPokemonByType('fire');

    expect(members).toEqual([{ id: 4, name: 'charmander', slot: 1 }]);
  });
});

describe('buildPokemonTypeIndex', () => {
  const byType: Record<string, TypeMember[]> = {
    grass: [
      { id: 1, name: 'bulbasaur', slot: 1 },
      { id: 999, name: 'foo', slot: 2 },
    ],
    poison: [
      { id: 1, name: 'bulbasaur', slot: 2 },
      { id: 999, name: 'foo', slot: 1 },
    ],
    fire: [{ id: 4, name: 'charmander', slot: 1 }],
  };

  const loadType = (type: string) => Promise.resolve(byType[type] ?? []);

  it('reads every canonical type once and maps each Pokémon to its types in slot order', async () => {
    const loader = jest.fn(loadType);

    const index = await buildPokemonTypeIndex(loader);

    expect(loader).toHaveBeenCalledTimes(POKEMON_TYPES.length);
    expect(loader.mock.calls.map(([type]) => type)).toEqual([...POKEMON_TYPES]);
    expect(index.bulbasaur).toEqual(['grass', 'poison']);
    // Sorted by slot, not by the order the types were loaded.
    expect(index.foo).toEqual(['poison', 'grass']);
    expect(index.charmander).toEqual(['fire']);
  });

  it('skips a failing type instead of failing the whole map', async () => {
    const index = await buildPokemonTypeIndex((type) =>
      type === 'poison' ? Promise.reject(new TypeError('boom')) : loadType(type),
    );

    // Grass still resolves; the failed poison load just contributes nothing.
    expect(index.bulbasaur).toEqual(['grass']);
    expect(index.foo).toEqual(['grass']);
  });

  it('rejects when every type fails, so an empty index is never cached', async () => {
    await expect(
      buildPokemonTypeIndex(() => Promise.reject(new TypeError('offline'))),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('reports the index built so far as batches land', async () => {
    const onProgress = jest.fn();

    const index = await buildPokemonTypeIndex(loadType, onProgress);

    expect(onProgress).toHaveBeenCalled();
    // Progress is only reported once there is real data, never as an empty map.
    for (const [partial] of onProgress.mock.calls) {
      expect(Object.keys(partial).length).toBeGreaterThan(0);
    }
    // Every partial is a subset of the finished index.
    const [firstPartial] = onProgress.mock.calls[0];
    for (const name of Object.keys(firstPartial)) {
      expect(index[name]).toEqual(expect.arrayContaining(firstPartial[name]));
    }
  });

  it('indexes a Pokémon whose name collides with an Object prototype member', async () => {
    const index = await buildPokemonTypeIndex((type) =>
      type === 'grass' ? Promise.resolve([{ id: 1, name: '__proto__', slot: 1 }]) : loadType(type),
    );

    expect(index['__proto__']).toEqual(['grass']);
  });
});

describe('getMove', () => {
  it('normalizes the name before requesting', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 22, name: 'vine-whip' }));

    await getMove(' Vine-Whip ');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://pokeapi.co/api/v2/move/vine-whip',
      expect.anything(),
    );
  });

  it('throws a move-specific ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(getMove('no-such-move')).rejects.toThrow('Move not found.');
  });
});
