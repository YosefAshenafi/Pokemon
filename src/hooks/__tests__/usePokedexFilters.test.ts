import { act, renderHook } from '@testing-library/react-native';

import { MAX_TYPE_FILTERS } from '@/constants/ui';

import { usePokedexFilters } from '../usePokedexFilters';

describe('usePokedexFilters', () => {
  it('starts with nothing searched or filtered', () => {
    const { result } = renderHook(() => usePokedexFilters());

    expect(result.current.query).toBe('');
    expect(result.current.activeTypes).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.isFiltering).toBe(false);
  });

  it('treats a whitespace-only query as no search at all', () => {
    const { result } = renderHook(() => usePokedexFilters());

    act(() => result.current.setQuery('   '));

    expect(result.current.query).toBe('   ');
    expect(result.current.isSearching).toBe(false);
  });

  it('adds and removes a type as it is toggled', () => {
    const { result } = renderHook(() => usePokedexFilters());

    act(() => result.current.toggleType('grass'));
    expect(result.current.activeTypes).toEqual(['grass']);
    expect(result.current.isFiltering).toBe(true);

    act(() => result.current.toggleType('grass'));
    expect(result.current.activeTypes).toEqual([]);
    expect(result.current.isFiltering).toBe(false);
  });

  it('refuses a selection past the ceiling, since no Pokémon has three types', () => {
    const { result } = renderHook(() => usePokedexFilters());

    act(() => result.current.toggleType('grass'));
    act(() => result.current.toggleType('poison'));
    act(() => result.current.toggleType('fire'));

    expect(result.current.activeTypes).toEqual(['grass', 'poison']);
    expect(result.current.activeTypes.length).toBe(MAX_TYPE_FILTERS);
  });

  it('still lets a selected type be removed once the ceiling is reached', () => {
    const { result } = renderHook(() => usePokedexFilters());

    act(() => result.current.toggleType('grass'));
    act(() => result.current.toggleType('poison'));
    act(() => result.current.toggleType('grass'));

    expect(result.current.activeTypes).toEqual(['poison']);
  });

  it('clears every selected type at once', () => {
    const { result } = renderHook(() => usePokedexFilters());

    act(() => result.current.toggleType('grass'));
    act(() => result.current.toggleType('poison'));
    act(() => result.current.clearTypes());

    expect(result.current.activeTypes).toEqual([]);
  });
});
