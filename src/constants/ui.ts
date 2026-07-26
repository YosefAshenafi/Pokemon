export const SKELETON_COUNT = 8;

export const LIST_INITIAL_RENDER = 8;
export const LIST_BATCH_SIZE = 8;
export const LIST_WINDOW_SIZE = 7;

export const CARD_MAX_FONT_SCALE = 1.3;

export const CARD_METRICS = {
  border: 1,
  padding: 12,
  title: 20,
  gap: 8,
  artwork: 96,
  chips: 22,
  rowGap: 12,
} as const;

export function gridRowHeight(fontScale: number): number {
  const scale = Math.min(fontScale, CARD_MAX_FONT_SCALE);
  const { border, padding, title, gap, artwork, chips, rowGap } = CARD_METRICS;
  return (
    border * 2 +
    padding * 2 +
    Math.round(title * scale) +
    gap +
    artwork +
    gap +
    Math.round(chips * scale) +
    rowGap
  );
}

export const LIST_END_REACHED_THRESHOLD = 0.4;

export const MAX_TYPE_FILTERS = 2;

export const MOVES_PREVIEW_COUNT = 8;

export const STAT_BAR_MAX = 160;

export const SCREEN_PADDING = 16;

export const SCREEN_BOTTOM_PADDING = 40;
export const GRID_BOTTOM_PADDING = 32;
