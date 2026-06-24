/**
 * The q-ching palette — ink, paper, and cinnabar.
 *
 * Chalk is used directly for fine-grained styling of text we pass to Ink's
 * <Text> as children. Ink also accepts a `color` prop on <Text>; for arbitrary
 * hex values we lean on chalk so the look stays consistent everywhere.
 */
import chalk from 'chalk';

export const palette = {
  /** Old-book paper — warm off-white for primary prose. */
  paper: '#e8e2d0',
  /** Faded ink for body text. */
  ink: '#cfc7b0',
  /** Dim ink for secondary/meta text (seeds, hints). */
  dim: '#8a8268',
  /** The seal — cinnabar red, used for changing lines and accents. */
  cinnabar: '#b34733',
  /** Jade — for success / a source that answered. */
  jade: '#6f9b6e',
  /** Gold — titles and the hexagram glyph. */
  gold: '#c9a44a',
  /** Sky/indigo — the quantum beacon. */
  beacon: '#7c9fd6',
} as const;

export const c = {
  paper: chalk.hex(palette.paper),
  ink: chalk.hex(palette.ink),
  dim: chalk.hex(palette.dim),
  cinnabar: chalk.hex(palette.cinnabar),
  cinnabarBold: chalk.hex(palette.cinnabar).bold,
  jade: chalk.hex(palette.jade),
  gold: chalk.hex(palette.gold),
  goldBold: chalk.hex(palette.gold).bold,
  beacon: chalk.hex(palette.beacon),
} as const;

/** Gradient stops for the splash title, ink -> cinnabar -> gold. */
export const titleGradient = [palette.cinnabar, palette.gold, palette.paper];
