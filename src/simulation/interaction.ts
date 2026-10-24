import { BUTTON_SIZE, elementFitsOnField, type Layout } from '../layout';
import { isInsideRectangle } from '../geometry';
import { clearField } from './circuit';
import { addFieldInput, addFieldOutput, removeFieldInput, removeFieldOutput } from './field-io';
import type { BarItem, Circuit, IoNode } from './types';
import {
  barItemAt,
  connectOriented,
  detachSink,
  ioNodeAt,
  moveSelectedElement,
  orientWire,
  selectElementAt,
  selectLineAt,
  toggleInputsAt,
  unselectElements,
  unselectLines,
} from './wiring';

export interface PointerSession {
  xDown: number;
  yDown: number;
  selectedXWhenDown: number;
  selectedYWhenDown: number;
  drawingFrom: IoNode | null;
  elementToSpawn: BarItem | null;
  moving: boolean;
  drawing: boolean;
  spawning: boolean;
}

export function createPointerSession(): PointerSession {
  return {
    xDown: 0,
    yDown: 0,
    selectedXWhenDown: 0,
    selectedYWhenDown: 0,
    drawingFrom: null,
    elementToSpawn: null,
    moving: false,
    drawing: false,
    spawning: false,
  };
}

function pressButtonsAt(circuit: Circuit, layout: Layout, x: number, y: number): void {
  const size = BUTTON_SIZE;
  if (isInsideRectangle(x, y, layout.plusInputX, layout.plusInputY, size, size)) {
    addFieldInput(circuit, layout);
  }
  if (isInsideRectangle(x, y, layout.minusInputX, layout.minusInputY, size, size)) {
    removeFieldInput(circuit, layout);
  }
  if (isInsideRectangle(x, y, layout.plusOutputX, layout.plusOutputY, size, size)) {
    addFieldOutput(circuit, layout);
  }
  if (isInsideRectangle(x, y, layout.minusOutputX, layout.minusOutputY, size, size)) {
    removeFieldOutput(circuit, layout);
  }
}

function endGesture(circuit: Circuit, session: PointerSession): void {
  session.moving = false;
  session.drawing = false;
  session.spawning = false;
  circuit.line = null;
  circuit.spawningElement = null;
}

export function pointerDown(
  circuit: Circuit,
  layout: Layout,
  session: PointerSession,
  x: number,
  y: number,
): 'modal' | undefined {
  session.xDown = x;
  session.yDown = y;
  unselectElements(circuit);
  unselectLines(circuit);
  toggleInputsAt(circuit, x, y);
  pressButtonsAt(circuit, layout, x, y);

  const node = ioNodeAt(circuit, x, y);
  if (node) {
    session.drawingFrom = node;
    session.drawing = true;
    return;
  }

  const bar = barItemAt(circuit, x, y);
  if (bar) {
    session.elementToSpawn = bar;
    if (bar.name === 'CREATE') {
      return 'modal';
    }
    session.spawning = true;
    return;
  }

  const element = selectElementAt(circuit, x, y);
  if (element) {
    session.moving = true;
    session.selectedXWhenDown = element.x;
    session.selectedYWhenDown = element.y;
    return;
  }
  selectLineAt(circuit, x, y);
  return undefined;
}

export function pointerMove(
  circuit: Circuit,
  layout: Layout,
  session: PointerSession,
  x: number,
  y: number,
): void {
  if (session.drawing && session.drawingFrom) {
    const from = session.drawingFrom;
    if ((from.kind === 'field-output' || from.kind === 'gate-input') && from.prev) {
      detachSink(from);
    }
    circuit.line = [x, y, from.x, from.y];
  }

  if (session.moving) {
    moveSelectedElement(
      circuit,
      layout,
      session.xDown,
      session.yDown,
      session.selectedXWhenDown,
      session.selectedYWhenDown,
      x,
      y,
    );
  }

  if (session.spawning && session.elementToSpawn) {
    const item = session.elementToSpawn;
    circuit.spawningElement = {
      name: item.name,
      x: x - item.width / 2,
      y: y - item.height / 2,
      width: item.width,
      height: item.height,
    };
  }
}

export function pointerUp(
  circuit: Circuit,
  layout: Layout,
  session: PointerSession,
  x: number,
  y: number,
): void {
  if (session.drawing && session.drawingFrom) {
    const node = ioNodeAt(circuit, x, y);
    if (node && node !== session.drawingFrom) {
      const oriented = orientWire(session.drawingFrom, node);
      if (oriented) {
        connectOriented(oriented.from, oriented.to);
      }
    }
  }

  if (session.spawning && session.elementToSpawn && circuit.spawningElement) {
    const preview = circuit.spawningElement;
    const created = session.elementToSpawn.createElement(preview.x, preview.y);
    if (typeof created !== 'boolean' && elementFitsOnField(created, layout)) {
      circuit.elements.push(created);
    }
  }

  endGesture(circuit, session);
}

export function pointerLeave(circuit: Circuit, session: PointerSession): void {
  endGesture(circuit, session);
}

/** Enter in the name modal. A truthy factory result clears the board, as before. */
export function confirmCreatingElement(
  circuit: Circuit,
  layout: Layout,
  session: PointerSession,
): void {
  const item = session.elementToSpawn;
  if (!item) {
    return;
  }
  const created = item.createElement(circuit.creatingElementName);
  if (created) {
    clearField(circuit, layout);
  }
}
