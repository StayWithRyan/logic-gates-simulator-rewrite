/** Colors and sizes taken from the original `constants.js`. */
export const COLORS = {
  backgroundColor: '#2f2f2f',
  fieldColor: '#2c2c2c',
  fieldBorderColor: '#3e3e3e',
  noSignalColor: '#1c2028',
  signalColor: '#e81e32',
  componentsBackgroundColor: '#1f1f1f',
  elementsColor: '#5e24b5',
  elementsSelectedColor: '#7448b5',
  notElementsColor: '#891f1b',
  notElementsSelectedColor: '#8a3a37',
  andElementsColor: '#29739e',
  andElementsSelectedColor: '#497f9e',
  orElementsColor: '#8d4da4',
  orElementsSelectedColor: '#956da3',
  xorElementsColor: '#bb3a78',
  xorElementsSelectedColor: '#ba5f8b',
} as const;

export const FIELD_IO_SIZE = 40;
export const GATE_IO_SIZE = 25;
export const GATE_IO_MARGIN = 10;
export const FIELD_IO_GAP = 20;
export const BUTTON_SIZE = 30;

/** Gates must sit this far inside the field, matching the original hit bounds. */
export const FIELD_SIDE_INSET = 100;
export const FIELD_VERTICAL_INSET = 5;

export const BAR_BUTTON_HEIGHT = 40;
export const BAR_BUTTON_GAP = 20;

export interface Layout {
  viewportWidth: number;
  viewportHeight: number;
  fieldBeginX: number;
  fieldEndX: number;
  fieldBeginY: number;
  fieldEndY: number;
  fieldWidth: number;
  fieldHeight: number;
  plusInputX: number;
  plusInputY: number;
  minusInputX: number;
  minusInputY: number;
  plusOutputX: number;
  plusOutputY: number;
  minusOutputX: number;
  minusOutputY: number;
}

export function createLayout(viewportWidth: number, viewportHeight: number): Layout {
  const fieldBeginX = 40;
  const fieldEndX = viewportWidth - 40;
  const fieldBeginY = 20;
  const fieldEndY = viewportHeight - 80;
  return {
    viewportWidth,
    viewportHeight,
    fieldBeginX,
    fieldEndX,
    fieldBeginY,
    fieldEndY,
    fieldWidth: fieldEndX - fieldBeginX,
    fieldHeight: fieldEndY - fieldBeginY,
    plusInputX: 3,
    plusInputY: 20,
    minusInputX: 3,
    minusInputY: 70,
    plusOutputX: viewportWidth - 40 + 6,
    plusOutputY: 20,
    minusOutputX: viewportWidth - 40 + 6,
    minusOutputY: 70,
  };
}

export function elementFitsOnField(
  element: { x: number; y: number; width: number; height: number },
  layout: Layout,
): boolean {
  return (
    element.x > layout.fieldBeginX + FIELD_SIDE_INSET &&
    element.y > layout.fieldBeginY + FIELD_VERTICAL_INSET &&
    element.x + element.width < layout.fieldEndX - FIELD_SIDE_INSET &&
    element.y + element.height < layout.fieldEndY - FIELD_VERTICAL_INSET
  );
}
