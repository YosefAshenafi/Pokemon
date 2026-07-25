/**
 * Layout and rendering numbers shared by more than one screen or component.
 *
 * Values only one component can meaningfully change - the splash timings, the
 * pulse duration, a pokéball's ring ratio - stay next to that component instead
 * of collecting here, so this file keeps describing app-wide decisions rather
 * than becoming a drawer for every number in the project.
 */

/** Skeleton cards drawn while the first page loads - roughly one screenful. */
export const SKELETON_COUNT = 8;

/**
 * FlatList windowing. Cards are cheap to render (artwork comes from the id and
 * types are passed in), so a small batch keeps the first paint fast without the
 * blank rows a tight window leaves behind during a fast fling.
 */
export const LIST_INITIAL_RENDER = 8;
export const LIST_BATCH_SIZE = 8;
export const LIST_WINDOW_SIZE = 7;

/** Fraction of a screen from the end at which the next page is requested. */
export const LIST_END_REACHED_THRESHOLD = 0.4;

/**
 * Types selectable at once. The filter keeps Pokémon that have *every* selected
 * type, and a Pokémon has at most two, so a third selection could only ever
 * return nothing - the sheet stops there rather than teaching that through an
 * empty grid.
 */
export const MAX_TYPE_FILTERS = 2;

/** Moves shown on the detail screen before the "See all" toggle. */
export const MOVES_PREVIEW_COUNT = 8;

/** Scale ceiling for a base-stat bar; 160 covers all but a handful of legendaries. */
export const STAT_BAR_MAX = 160;

/** Horizontal gutter every screen's scrollable content sits inside. */
export const SCREEN_PADDING = 16;

/** Trailing space below a scrolled screen, so the last row clears the edge. */
export const SCREEN_BOTTOM_PADDING = 40;

/** The grid ends on a row of cards rather than text, so it needs less. */
export const GRID_BOTTOM_PADDING = 32;
