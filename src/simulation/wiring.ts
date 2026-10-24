import { FIELD_IO_SIZE, GATE_IO_SIZE, elementFitsOnField, type Layout } from '../layout';
import {
  WIRE_HIT_DISTANCE_SQUARED,
  isInsideCircle,
  isInsideRectangle,
  squaredDistanceToSegment,
} from '../geometry';
import { deleteNext, driveSource, layoutElement } from './gates';
import type {
  BarItem,
  Circuit,
  IoNode,
  LogicElement,
  SinkPort,
  SourcePort,
} from './types';
import { isFieldInput, isFieldOutput, isGateInput, isGateOutput } from './types';

export interface OrientedWire {
  from: SourcePort;
  to: SinkPort;
}

/** Normalizes a drag so signal always flows source → sink. Same pairs the original accepted. */
export function orientWire(a: IoNode, b: IoNode): OrientedWire | null {
  if (a === b) {
    return null;
  }
  if (
    (isFieldInput(a) && isGateInput(b)) ||
    (isGateOutput(a) && isGateInput(b)) ||
    (isGateOutput(a) && isFieldOutput(b))
  ) {
    return { from: a, to: b };
  }
  if (
    (isGateInput(a) && isFieldInput(b)) ||
    (isGateInput(a) && isGateOutput(b)) ||
    (isFieldOutput(a) && isGateOutput(b))
  ) {
    return { from: b, to: a };
  }
  return null;
}

export function connectOriented(from: SourcePort, to: SinkPort): void {
  if (to.prev) {
    deleteNext(to.prev, to);
  }
  from.next.push(to);
  to.prev = from;
  to.signaled = from.signaled;
}

export function detachSink(sink: SinkPort): void {
  if (!sink.prev) {
    return;
  }
  deleteNext(sink.prev, sink);
  sink.signaled = false;
  sink.prev = null;
}

export function toggleInputsAt(circuit: Circuit, x: number, y: number): void {
  const radius = FIELD_IO_SIZE / 2;
  for (const input of circuit.inputs) {
    if (isInsideCircle(x, y, input.fieldX, input.y, radius)) {
      driveSource(input, !input.signaled);
    }
  }
}

export function ioNodeAt(circuit: Circuit, x: number, y: number): IoNode | null {
  let node: IoNode | null = null;
  const radius = GATE_IO_SIZE / 2;
  for (const input of circuit.inputs) {
    if (isInsideCircle(x, y, input.x, input.y, radius)) {
      node = input;
    }
  }
  for (const output of circuit.outputs) {
    if (isInsideCircle(x, y, output.x, output.y, radius)) {
      node = output;
    }
  }
  for (const element of circuit.elements) {
    for (const input of element.inputs) {
      if (isInsideCircle(x, y, input.x, input.y, radius)) {
        node = input;
      }
    }
    for (const output of element.outputs) {
      if (isInsideCircle(x, y, output.x, output.y, radius)) {
        node = output;
      }
    }
  }
  return node;
}

export function barItemAt(circuit: Circuit, x: number, y: number): BarItem | null {
  let found: BarItem | null = null;
  for (const item of circuit.elementsOnBar) {
    if (isInsideRectangle(x, y, item.x, item.y, item.width, item.height)) {
      found = item;
    }
  }
  return found;
}

export function unselectElements(circuit: Circuit): void {
  for (const element of circuit.elements) {
    element.selected = false;
  }
  circuit.selectedElement = null;
}

export function unselectLines(circuit: Circuit): void {
  for (const input of circuit.inputs) {
    input.selectedNext = null;
  }
  for (const element of circuit.elements) {
    for (const output of element.outputs) {
      output.selectedNext = null;
    }
  }
  circuit.selectedLineFrom = null;
}

export function selectElementAt(circuit: Circuit, x: number, y: number): LogicElement | null {
  for (let i = circuit.elements.length - 1; i >= 0; i--) {
    const element = circuit.elements[i];
    if (isInsideRectangle(x, y, element.x, element.y, element.width, element.height)) {
      element.selected = true;
      circuit.selectedElement = element;
      return element;
    }
  }
  return null;
}

export function selectLineAt(circuit: Circuit, x: number, y: number): boolean {
  let selected = false;
  const consider = (source: SourcePort) => {
    for (const next of source.next) {
      if (selected) {
        continue;
      }
      const distance = squaredDistanceToSegment(source.x, source.y, next.x, next.y, x, y);
      if (distance < WIRE_HIT_DISTANCE_SQUARED) {
        circuit.selectedLineFrom = source;
        source.selectedNext = next;
        selected = true;
      }
    }
  };
  for (const input of circuit.inputs) {
    consider(input);
  }
  for (const element of circuit.elements) {
    for (const output of element.outputs) {
      consider(output);
    }
  }
  return selected;
}

export function moveSelectedElement(
  circuit: Circuit,
  layout: Layout,
  xDown: number,
  yDown: number,
  selectedX: number,
  selectedY: number,
  x: number,
  y: number,
): void {
  const element = circuit.selectedElement;
  if (!element) {
    return;
  }
  const next = {
    x: selectedX + (x - xDown),
    y: selectedY + (y - yDown),
    width: element.width,
    height: element.height,
  };
  if (elementFitsOnField(next, layout)) {
    layoutElement(element, next.x, next.y);
  }
}

export function deleteSelection(circuit: Circuit): void {
  const selected = circuit.selectedElement;
  if (selected) {
    for (let i = 0; i < circuit.elements.length; i++) {
      if (circuit.elements[i] === selected) {
        for (const input of selected.inputs) {
          if (input.prev) {
            deleteNext(input.prev, input);
          }
        }
        for (const output of selected.outputs) {
          for (const next of output.next) {
            next.prev = null;
            next.signaled = false;
          }
        }
        circuit.elements.splice(i, 1);
      }
    }
  }
  const lineFrom = circuit.selectedLineFrom;
  const sink = lineFrom?.selectedNext;
  if (lineFrom && sink) {
    sink.prev = null;
    sink.signaled = false;
    deleteNext(lineFrom, sink);
  }
}
