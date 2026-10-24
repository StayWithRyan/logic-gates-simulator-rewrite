import { BAR_BUTTON_GAP, BAR_BUTTON_HEIGHT, type Layout } from '../layout';
import { barButtonWidth } from './gates';
import type { BarCreate, BarItem, Circuit } from './types';

export function addElementToBar(
  circuit: Circuit,
  layout: Layout,
  name: string,
  createElement: BarCreate,
): boolean {
  const width = barButtonWidth(name);
  if (width + circuit.lastElementX > layout.fieldEndX) {
    return false;
  }
  const item: BarItem = {
    name,
    createElement,
    x: circuit.lastElementX,
    y: layout.fieldEndY + 30,
    width,
    height: BAR_BUTTON_HEIGHT,
  };
  circuit.elementsOnBar.push(item);
  circuit.lastElementX += width + BAR_BUTTON_GAP;
  return true;
}
