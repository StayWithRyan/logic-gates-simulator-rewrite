import { describe, expect, it } from 'vitest';
import { COLORS } from '../layout';
import {
  CLASSIC_PALETTE,
  DEFAULT_PALETTE_ID,
  PALETTE_STORAGE_KEY,
  PALETTES,
  colorsForKind,
  paletteById,
  readStoredPaletteId,
  writeStoredPaletteId,
} from './palettes';

function memoryStorage(initial?: Record<string, string>): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('color palettes', () => {
  it('keeps Classic identical to the original color constants', () => {
    expect(CLASSIC_PALETTE.backgroundColor).toBe(COLORS.backgroundColor);
    expect(CLASSIC_PALETTE.fieldColor).toBe(COLORS.fieldColor);
    expect(CLASSIC_PALETTE.fieldBorderColor).toBe(COLORS.fieldBorderColor);
    expect(CLASSIC_PALETTE.noSignalColor).toBe(COLORS.noSignalColor);
    expect(CLASSIC_PALETTE.signalColor).toBe(COLORS.signalColor);
    expect(CLASSIC_PALETTE.componentsBackgroundColor).toBe(COLORS.componentsBackgroundColor);
    expect(CLASSIC_PALETTE.elementsColor).toBe(COLORS.elementsColor);
    expect(CLASSIC_PALETTE.elementsSelectedColor).toBe(COLORS.elementsSelectedColor);
    expect(CLASSIC_PALETTE.notElementsColor).toBe(COLORS.notElementsColor);
    expect(CLASSIC_PALETTE.notElementsSelectedColor).toBe(COLORS.notElementsSelectedColor);
    expect(CLASSIC_PALETTE.andElementsColor).toBe(COLORS.andElementsColor);
    expect(CLASSIC_PALETTE.andElementsSelectedColor).toBe(COLORS.andElementsSelectedColor);
    expect(CLASSIC_PALETTE.orElementsColor).toBe(COLORS.orElementsColor);
    expect(CLASSIC_PALETTE.orElementsSelectedColor).toBe(COLORS.orElementsSelectedColor);
    expect(CLASSIC_PALETTE.xorElementsColor).toBe(COLORS.xorElementsColor);
    expect(CLASSIC_PALETTE.xorElementsSelectedColor).toBe(COLORS.xorElementsSelectedColor);
    expect(DEFAULT_PALETTE_ID).toBe('classic');
  });

  it('offers a small built-in set with unique ids', () => {
    expect(PALETTES.map((palette) => palette.name)).toEqual(['Classic', 'Slate', 'Dusk', 'Ink']);
    expect(new Set(PALETTES.map((palette) => palette.id)).size).toBe(PALETTES.length);
  });

  it('resolves each gate family from the active palette', () => {
    expect(colorsForKind(CLASSIC_PALETTE, 'AND')).toEqual({
      color: '#29739e',
      selected: '#497f9e',
    });
    expect(colorsForKind(CLASSIC_PALETTE, 'OR').color).toBe('#8d4da4');
    expect(colorsForKind(CLASSIC_PALETTE, 'NOT').color).toBe('#891f1b');
    expect(colorsForKind(CLASSIC_PALETTE, 'XOR').color).toBe('#bb3a78');
    expect(colorsForKind(CLASSIC_PALETTE, 'CUSTOM')).toEqual({
      color: COLORS.elementsColor,
      selected: COLORS.elementsSelectedColor,
    });

    const slate = paletteById('slate');
    expect(colorsForKind(slate, 'AND').color).toBe(slate.andElementsColor);
    expect(colorsForKind(slate, 'AND').color).not.toBe(CLASSIC_PALETTE.andElementsColor);
    expect(slate.fieldColor).not.toBe(CLASSIC_PALETTE.fieldColor);
    expect(slate.signalColor).not.toBe(CLASSIC_PALETTE.signalColor);
    expect(slate.componentsBackgroundColor).not.toBe(CLASSIC_PALETTE.componentsBackgroundColor);
  });

  it('falls back to Classic for an unknown id', () => {
    expect(paletteById('nope')).toBe(CLASSIC_PALETTE);
    expect(paletteById('dusk').id).toBe('dusk');
  });

  it('remembers a known palette and ignores unknown stored values', () => {
    const storage = memoryStorage();
    expect(readStoredPaletteId(storage)).toBe('classic');

    writeStoredPaletteId(storage, 'ink');
    expect(storage.getItem(PALETTE_STORAGE_KEY)).toBe('ink');
    expect(readStoredPaletteId(storage)).toBe('ink');

    writeStoredPaletteId(storage, 'custom-editor');
    expect(storage.getItem(PALETTE_STORAGE_KEY)).toBe('ink');

    const invalid = memoryStorage({ [PALETTE_STORAGE_KEY]: 'rainbow' });
    expect(readStoredPaletteId(invalid)).toBe('classic');
  });

  it('treats a throwing storage as Classic and does not throw on write', () => {
    const broken: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(readStoredPaletteId(broken)).toBe('classic');
    expect(() => writeStoredPaletteId(broken, 'slate')).not.toThrow();
  });
});
