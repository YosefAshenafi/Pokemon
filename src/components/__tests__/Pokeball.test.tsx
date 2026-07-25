import { render } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';

import { Pokeball } from '../Pokeball';

type RenderedNode = { props: Record<string, unknown> };

function root(result: ReturnType<typeof render>): RenderedNode {
  const tree = result.toJSON();
  return (Array.isArray(tree) ? tree[0] : tree) as unknown as RenderedNode;
}

function rootStyle(result: ReturnType<typeof render>): ViewStyle {
  return StyleSheet.flatten(root(result).props.style as ViewStyle);
}

describe('Pokeball', () => {
  it('draws at its default size when none is given', () => {
    const style = rootStyle(render(<Pokeball />));

    expect(style.width).toBe(150);
    expect(style.height).toBe(150);
    expect(style.borderRadius).toBe(75);
  });

  it('scales its ring and radius to an explicit size', () => {
    const style = rootStyle(render(<Pokeball size={56} />));

    expect(style.width).toBe(56);
    expect(style.height).toBe(56);
    expect(style.borderRadius).toBe(28);
    // 9% of the size, rounded.
    expect(style.borderWidth).toBe(5);
  });

  it('uses the supplied colour for its ring', () => {
    const style = rootStyle(render(<Pokeball color="rgb(1, 2, 3)" />));

    expect(style.borderColor).toBe('rgb(1, 2, 3)');
  });

  it('is hidden from assistive technology, being decorative', () => {
    const props = root(render(<Pokeball />)).props;

    expect(props.accessible).toBe(false);
    expect(props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
