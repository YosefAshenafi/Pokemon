import { ApiError, getMove, getPokemon, getPokemonPage } from '../pokeapi';

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
