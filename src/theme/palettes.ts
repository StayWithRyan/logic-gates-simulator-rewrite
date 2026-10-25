import { COLORS } from '../layout';
import type { ElementKind } from '../simulation/types';

/** Every surface the canvas paints, plus the name shown in the switcher. */
export interface Palette {
  id: string;
  name: string;
  backgroundColor: string;
  fieldColor: string;
  fieldBorderColor: string;
  noSignalColor: string;
  signalColor: string;
  componentsBackgroundColor: string;
  elementsColor: string;
  elementsSelectedColor: string;
  notElementsColor: string;
  notElementsSelectedColor: string;
  andElementsColor: string;
  andElementsSelectedColor: string;
  orElementsColor: string;
  orElementsSelectedColor: string;
  xorElementsColor: string;
  xorElementsSelectedColor: string;
}

export const PALETTE_STORAGE_KEY = 'logic-gates-palette';

/** The original simulator colors. This is the default. */
export const CLASSIC_PALETTE: Palette = {
  id: 'classic',
  name: 'Classic',
  backgroundColor: COLORS.backgroundColor,
  fieldColor: COLORS.fieldColor,
  fieldBorderColor: COLORS.fieldBorderColor,
  noSignalColor: COLORS.noSignalColor,
  signalColor: COLORS.signalColor,
  componentsBackgroundColor: COLORS.componentsBackgroundColor,
  elementsColor: COLORS.elementsColor,
  elementsSelectedColor: COLORS.elementsSelectedColor,
  notElementsColor: COLORS.notElementsColor,
  notElementsSelectedColor: COLORS.notElementsSelectedColor,
  andElementsColor: COLORS.andElementsColor,
  andElementsSelectedColor: COLORS.andElementsSelectedColor,
  orElementsColor: COLORS.orElementsColor,
  orElementsSelectedColor: COLORS.orElementsSelectedColor,
  xorElementsColor: COLORS.xorElementsColor,
  xorElementsSelectedColor: COLORS.xorElementsSelectedColor,
};

/**
 * Cooler room, same gate hues. Field and toolbar shift to blue-gray so the
 * change reads immediately against Classic.
 */
const SLATE_PALETTE: Palette = {
  id: 'slate',
  name: 'Slate',
  backgroundColor: '#1b2433',
  fieldColor: '#162033',
  fieldBorderColor: '#41597a',
  noSignalColor: '#0e1522',
  signalColor: '#ff3355',
  componentsBackgroundColor: '#10192a',
  elementsColor: '#6a3ad4',
  elementsSelectedColor: '#8860dc',
  notElementsColor: '#b33934',
  notElementsSelectedColor: '#c45c58',
  andElementsColor: '#1f8fbf',
  andElementsSelectedColor: '#42a4cc',
  orElementsColor: '#a45cc0',
  orElementsSelectedColor: '#b67dcc',
  xorElementsColor: '#d44b8e',
  xorElementsSelectedColor: '#dc72a6',
};

/** Warm room. Gate families stay recognizable; chrome goes brown-gray. */
const DUSK_PALETTE: Palette = {
  id: 'dusk',
  name: 'Dusk',
  backgroundColor: '#34291f',
  fieldColor: '#2e241b',
  fieldBorderColor: '#6a5344',
  noSignalColor: '#1a130e',
  signalColor: '#ff4a2a',
  componentsBackgroundColor: '#231910',
  elementsColor: '#7a3ec4',
  elementsSelectedColor: '#9464d0',
  notElementsColor: '#a33a2e',
  notElementsSelectedColor: '#b85c50',
  andElementsColor: '#2a849c',
  andElementsSelectedColor: '#4c9ab0',
  orElementsColor: '#9a4e9e',
  orElementsSelectedColor: '#b070b2',
  xorElementsColor: '#c44a7a',
  xorElementsSelectedColor: '#d27098',
};

/** Near-black field with the same hues pushed brighter. */
const INK_PALETTE: Palette = {
  id: 'ink',
  name: 'Ink',
  backgroundColor: '#141414',
  fieldColor: '#0d0d0d',
  fieldBorderColor: '#3a3a3a',
  noSignalColor: '#05060a',
  signalColor: '#ff1f3a',
  componentsBackgroundColor: '#080808',
  elementsColor: '#7a2ee0',
  elementsSelectedColor: '#9458e8',
  notElementsColor: '#d12520',
  notElementsSelectedColor: '#e0504c',
  andElementsColor: '#1490c8',
  andElementsSelectedColor: '#3aabd8',
  orElementsColor: '#b44ad0',
  orElementsSelectedColor: '#c86cdc',
  xorElementsColor: '#e04090',
  xorElementsSelectedColor: '#ea68a8',
};

export const PALETTES: readonly Palette[] = [
  CLASSIC_PALETTE,
  SLATE_PALETTE,
  DUSK_PALETTE,
  INK_PALETTE,
];

export const DEFAULT_PALETTE_ID = CLASSIC_PALETTE.id;

export function paletteById(id: string): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? CLASSIC_PALETTE;
}

export function colorsForKind(palette: Palette, kind: ElementKind): { color: string; selected: string } {
  switch (kind) {
    case 'AND':
      return { color: palette.andElementsColor, selected: palette.andElementsSelectedColor };
    case 'OR':
      return { color: palette.orElementsColor, selected: palette.orElementsSelectedColor };
    case 'NOT':
      return { color: palette.notElementsColor, selected: palette.notElementsSelectedColor };
    case 'XOR':
      return { color: palette.xorElementsColor, selected: palette.xorElementsSelectedColor };
    case 'CUSTOM':
      return { color: palette.elementsColor, selected: palette.elementsSelectedColor };
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export function readStoredPaletteId(storage: Pick<Storage, 'getItem'>): string {
  try {
    const stored = storage.getItem(PALETTE_STORAGE_KEY);
    if (stored && PALETTES.some((palette) => palette.id === stored)) {
      return stored;
    }
  } catch {
    // Private mode and disabled storage both throw. Fall back to Classic.
  }
  return DEFAULT_PALETTE_ID;
}

export function writeStoredPaletteId(storage: Pick<Storage, 'setItem'>, id: string): void {
  if (!PALETTES.some((palette) => palette.id === id)) {
    return;
  }
  try {
    storage.setItem(PALETTE_STORAGE_KEY, id);
  } catch {
    // Ignore quota and privacy errors. The in-memory choice still applies.
  }
}
