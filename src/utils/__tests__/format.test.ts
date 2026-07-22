import {
  artworkUrl,
  formatEffectText,
  formatHeightFeetInches,
  formatHeightMeters,
  formatName,
  formatPokemonId,
  formatStatName,
  formatWeightKg,
  formatWeightLbs,
  idFromUrl,
  spriteUrl,
} from '../format';

describe('formatPokemonId', () => {
  it('pads short ids to three digits', () => {
    expect(formatPokemonId(1)).toBe('#001');
    expect(formatPokemonId(25)).toBe('#025');
  });

  it('leaves long ids untouched', () => {
    expect(formatPokemonId(1025)).toBe('#1025');
  });
});

describe('formatName', () => {
  it('capitalizes a simple name', () => {
    expect(formatName('bulbasaur')).toBe('Bulbasaur');
  });

  it('splits and capitalizes hyphenated names', () => {
    expect(formatName('mr-mime')).toBe('Mr Mime');
    expect(formatName('vine-whip')).toBe('Vine Whip');
  });
});

describe('height formatting (decimetres in)', () => {
  it('formats metres', () => {
    expect(formatHeightMeters(7)).toBe('0.7 m');
    expect(formatHeightMeters(20)).toBe('2.0 m');
  });

  it("formats feet'inches\" like the games do", () => {
    // Bulbasaur: 7 dm → 2'04"
    expect(formatHeightFeetInches(7)).toBe('2\'04"');
    // Charizard: 17 dm → 5'07"
    expect(formatHeightFeetInches(17)).toBe('5\'07"');
  });

  it('carries a rounded 12 inches into the next foot', () => {
    // 9 dm = 35.43 in = 2 ft 11.43 in → 2'11"; 61 dm = 240.16 in → 20'00"
    expect(formatHeightFeetInches(9)).toBe('2\'11"');
    expect(formatHeightFeetInches(61)).toBe('20\'00"');
  });
});

describe('weight formatting (hectograms in)', () => {
  it('formats kilograms', () => {
    expect(formatWeightKg(69)).toBe('6.9 kg');
  });

  it('formats pounds', () => {
    expect(formatWeightLbs(69)).toBe('15.2 lbs');
  });
});

describe('idFromUrl', () => {
  it('extracts the trailing resource id', () => {
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/10001')).toBe(10001);
  });

  it('returns null when there is no id', () => {
    expect(idFromUrl('https://pokeapi.co/api/v2/pokemon/')).toBeNull();
  });
});

describe('artworkUrl', () => {
  it('points at the official artwork sprite', () => {
    expect(artworkUrl(1)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    );
  });
});

describe('spriteUrl', () => {
  it('points at the small default sprite', () => {
    expect(spriteUrl(10033)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10033.png',
    );
  });
});

describe('formatEffectText', () => {
  it('fills in the effect chance placeholder', () => {
    expect(formatEffectText('Has a $effect_chance% chance to burn.', 10)).toBe(
      'Has a 10% chance to burn.',
    );
  });

  it('leaves text unchanged when there is no effect chance', () => {
    expect(formatEffectText('Never misses.', null)).toBe('Never misses.');
  });
});

describe('formatStatName', () => {
  it('maps API stat keys to display labels', () => {
    expect(formatStatName('hp')).toBe('HP');
    expect(formatStatName('special-attack')).toBe('Sp. Atk');
    expect(formatStatName('speed')).toBe('Speed');
  });

  it('falls back to title-casing unknown stats', () => {
    expect(formatStatName('some-new-stat')).toBe('Some New Stat');
  });
});
