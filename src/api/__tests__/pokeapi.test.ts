import {
  ApiError,
  getMove,
  getPokemon,
  getPokemonByType,
  getPokemonPage,
  getPokemonTypeIndex,
} from '../pokeapi';

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

describe('getPokemonByType', () => {
  it('normalizes the type, maps members to summaries, and sorts by id', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        pokemon: [
          { slot: 1, pokemon: { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' } },
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
      { id: 4, name: 'charmander' },
      { id: 6, name: 'charizard' },
    ]);
  });

  it('throws a type-specific ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(getPokemonByType('notatype')).rejects.toThrow('Type not found.');
  });
});

describe('getPokemonTypeIndex', () => {
  const byType: Record<string, { slot: number; pokemon: { name: string; url: string } }[]> = {
    grass: [
      { slot: 1, pokemon: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' } },
      { slot: 2, pokemon: { name: 'foo', url: 'https://pokeapi.co/api/v2/pokemon/999/' } },
    ],
    poison: [
      { slot: 2, pokemon: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' } },
      { slot: 1, pokemon: { name: 'foo', url: 'https://pokeapi.co/api/v2/pokemon/999/' } },
    ],
    fire: [
      { slot: 1, pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' } },
    ],
  };

  function membersResponse(url: string) {
    return jsonResponse({ pokemon: byType[url.split('/type/')[1]] ?? [] });
  }

  it('discovers the type set from the API and maps each Pokémon to its types in slot order', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/type')) {
        return Promise.resolve(
          jsonResponse({
            results: [
              { name: 'grass', url: '' },
              { name: 'poison', url: '' },
              { name: 'fire', url: '' },
            ],
          }),
        );
      }
      return Promise.resolve(membersResponse(url));
    });

    const index = await getPokemonTypeIndex();

    // The type set is discovered from the list endpoint, then each type is read.
    expect(mockFetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/type', expect.anything());
    expect(index.bulbasaur).toEqual(['grass', 'poison']);
    // Sorted by slot, not by the order the types were fetched.
    expect(index.foo).toEqual(['poison', 'grass']);
    expect(index.charmander).toEqual(['fire']);
  });

  it('falls back to the built-in type list when the type lookup fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/type')) return Promise.resolve(jsonResponse({}, 500));
      return Promise.resolve(membersResponse(url));
    });

    const index = await getPokemonTypeIndex();

    // Tried discovery, then read each of the 18 built-in types (1 + 18 calls).
    expect(mockFetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/type', expect.anything());
    expect(mockFetch).toHaveBeenCalledTimes(19);
    expect(index.bulbasaur).toEqual(['grass', 'poison']);
  });

  it('skips a failing type instead of failing the whole map', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/type')) {
        return Promise.resolve(
          jsonResponse({
            results: [
              { name: 'grass', url: '' },
              { name: 'poison', url: '' },
            ],
          }),
        );
      }
      if (url.endsWith('/type/poison')) return Promise.reject(new TypeError('boom'));
      return Promise.resolve(membersResponse(url));
    });

    const index = await getPokemonTypeIndex();

    // Grass still resolves; the failed poison fetch just contributes nothing.
    expect(index.bulbasaur).toEqual(['grass']);
    expect(index.foo).toEqual(['grass']);
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
