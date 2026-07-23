import type { PokemonSummary } from '@/api/types';

import { searchPokemonIndex } from '../usePokemonSearch';

const INDEX: PokemonSummary[] = [
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 5, name: 'charmeleon' },
  { id: 25, name: 'pikachu' },
  { id: 250, name: 'ho-oh' },
  { id: 251, name: 'celebi' },
];

const names = (results: PokemonSummary[]) => results.map((r) => r.name);

describe('searchPokemonIndex', () => {
  it('returns nothing for an empty query', () => {
    expect(searchPokemonIndex(INDEX, '   ')).toEqual([]);
  });

  it('ranks name prefix matches before substring matches', () => {
    // "char" prefixes charmander/charmeleon; nothing here is a substring-only match.
    expect(names(searchPokemonIndex(INDEX, 'char'))).toEqual(['charmander', 'charmeleon']);
  });

  it('matches a substring anywhere in the name', () => {
    expect(names(searchPokemonIndex(INDEX, 'saur'))).toEqual(['bulbasaur']);
  });

  it('matches Pokédex numbers by id, ordered by id', () => {
    // "25" prefixes ids 25, 250, 251.
    expect(names(searchPokemonIndex(INDEX, '25'))).toEqual(['pikachu', 'ho-oh', 'celebi']);
  });

  it('treats a "#" prefix and leading zeros as the same number', () => {
    expect(searchPokemonIndex(INDEX, '#25')).toEqual(searchPokemonIndex(INDEX, '25'));
    expect(names(searchPokemonIndex(INDEX, '#025'))).toEqual(['pikachu', 'ho-oh', 'celebi']);
  });

  it('finds a single Pokémon by its exact number', () => {
    expect(names(searchPokemonIndex(INDEX, '1'))).toEqual(['bulbasaur']);
  });
});
