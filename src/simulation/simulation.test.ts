import { describe, expect, it } from 'vitest';
import { isInsideCircle, isInsideRectangle, squaredDistanceToSegment } from '../geometry';
import { createLayout } from '../layout';
import { drawScene } from '../render/draw';
import { addCustomElementToBar, enumerateCombinations, sampleCustomTemplate } from './custom';
import {
  addFieldInput,
  addFieldOutput,
  canAddFieldIo,
  removeFieldInput,
  removeFieldOutput,
} from './field-io';
import { createBuiltinElement, instantiateCustom } from './gates';
import { createInitialCircuit } from './circuit';
import {
  confirmCreatingElement,
  createPointerSession,
  pointerDown,
  pointerLeave,
  pointerMove,
  pointerUp,
  type PointerSession,
} from './interaction';
import { stepSimulation } from './simulate';
import type { Circuit, LogicElement } from './types';
import {
  connectOriented,
  deleteSelection,
  orientWire,
  selectLineAt,
  unselectLines,
} from './wiring';

const layout = createLayout(1200, 800);

function fresh(): { circuit: Circuit; session: PointerSession } {
  return { circuit: createInitialCircuit(layout), session: createPointerSession() };
}

function place(circuit: Circuit, session: PointerSession, name: string, x: number, y: number): LogicElement {
  const button = circuit.elementsOnBar.find((item) => item.name === name);
  if (!button) {
    throw new Error(`missing toolbar button ${name}`);
  }
  pointerDown(circuit, layout, session, button.x + button.width / 2, button.y + button.height / 2);
  pointerMove(circuit, layout, session, x + button.width / 2, y + button.height / 2);
  pointerUp(circuit, layout, session, x + button.width / 2, y + button.height / 2);
  const element = circuit.elements[circuit.elements.length - 1];
  if (!element || element.name !== name) {
    throw new Error(`failed to place ${name}`);
  }
  return element;
}

function wire(
  circuit: Circuit,
  session: PointerSession,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  pointerDown(circuit, layout, session, from.x, from.y);
  pointerMove(circuit, layout, session, to.x, to.y);
  pointerUp(circuit, layout, session, to.x, to.y);
}

describe('geometry', () => {
  it('measures squared distance to a segment, including endpoints', () => {
    expect(squaredDistanceToSegment(0, 0, 10, 0, 5, 0)).toBe(0);
    expect(squaredDistanceToSegment(0, 0, 10, 0, 5, 3)).toBe(9);
    expect(squaredDistanceToSegment(0, 0, 10, 0, 5, 4)).toBe(16);
    expect(squaredDistanceToSegment(0, 0, 10, 0, -3, 0)).toBe(9);
    expect(squaredDistanceToSegment(0, 0, 10, 0, 20, 0)).toBe(100);
    expect(squaredDistanceToSegment(0, 0, 0, 0, 3, 4)).toBe(25);
  });

  it('uses an inclusive rectangle and an exclusive circle radius', () => {
    expect(isInsideRectangle(0, 0, 0, 0, 10, 10)).toBe(true);
    expect(isInsideRectangle(10, 10, 0, 0, 10, 10)).toBe(true);
    expect(isInsideRectangle(10.1, 5, 0, 0, 10, 10)).toBe(false);
    expect(isInsideCircle(20, 0, 0, 0, 20)).toBe(false);
    expect(isInsideCircle(19, 0, 0, 0, 20)).toBe(true);
  });
});

describe('field pins', () => {
  it('starts with two inputs and one output, centered on the field', () => {
    const { circuit } = fresh();
    expect(circuit.inputs.map((pin) => [pin.x, pin.y, pin.fieldX])).toEqual([
      [110, 340, 40],
      [110, 400, 40],
    ]);
    expect(circuit.outputs[0]).toMatchObject({ x: 1090, y: 370, fieldX: 1160, signaled: false });
    expect(circuit.elementsOnBar.map((item) => [item.name, item.x, item.width, item.y, item.height])).toEqual([
      ['CREATE', 40, 174, 750, 40],
      ['OR', 234, 78, 750, 40],
      ['AND', 332, 102, 750, 40],
      ['NOT', 454, 102, 750, 40],
      ['XOR', 576, 102, 750, 40],
    ]);
  });

  it('adds pins until the original height check fails, and never removes the last one', () => {
    const { circuit } = fresh();
    while (circuit.inputs.length < 30) {
      const before = circuit.inputs.length;
      addFieldInput(circuit, layout);
      if (circuit.inputs.length === before) {
        break;
      }
    }
    expect(circuit.inputs.length).toBe(8);
    expect(canAddFieldIo(7, layout.fieldHeight)).toBe(true);
    expect(canAddFieldIo(8, layout.fieldHeight)).toBe(false);

    while (circuit.inputs.length > 0) {
      const before = circuit.inputs.length;
      removeFieldInput(circuit, layout);
      if (circuit.inputs.length === before) {
        break;
      }
    }
    expect(circuit.inputs.length).toBe(1);

    addFieldOutput(circuit, layout);
    expect(circuit.outputs.length).toBe(2);
    removeFieldOutput(circuit, layout);
    removeFieldOutput(circuit, layout);
    expect(circuit.outputs.length).toBe(1);
  });

  it('drops wires from a removed input and recenters the pins that remain', () => {
    const { circuit } = fresh();
    const gate = createBuiltinElement('AND', 400, 200);
    circuit.elements.push(gate);
    connectOriented(circuit.inputs[1], gate.inputs[0]);
    removeFieldInput(circuit, layout);
    expect(gate.inputs[0].prev).toBeNull();
    expect(gate.inputs[0].signaled).toBe(false);
    expect(circuit.inputs[0].y).toBe(370);

    addFieldOutput(circuit, layout);
    connectOriented(gate.outputs[0], circuit.outputs[1]);
    removeFieldOutput(circuit, layout);
    expect(gate.outputs[0].next).toHaveLength(0);
    expect(circuit.outputs).toHaveLength(1);
  });
});

describe('wiring', () => {
  it('accepts only source-to-sink pairs and replaces an occupied sink', () => {
    const { circuit } = fresh();
    const and = createBuiltinElement('AND', 400, 200);
    const or = createBuiltinElement('OR', 400, 320);
    circuit.elements.push(and, or);
    expect(orientWire(circuit.inputs[0], circuit.outputs[0])).toBeNull();
    expect(orientWire(and.outputs[0], or.outputs[0])).toBeNull();
    expect(orientWire(and.inputs[0], or.inputs[0])).toBeNull();
    expect(orientWire(and.inputs[0], circuit.inputs[0])?.from).toBe(circuit.inputs[0]);

    connectOriented(circuit.inputs[0], and.inputs[0]);
    connectOriented(circuit.inputs[0], or.inputs[0]);
    expect(circuit.inputs[0].next).toEqual([and.inputs[0], or.inputs[0]]);

    connectOriented(circuit.inputs[1], and.inputs[0]);
    expect(and.inputs[0].prev).toBe(circuit.inputs[1]);
    expect(circuit.inputs[0].next).toEqual([or.inputs[0]]);
    expect(and.inputs[0].signaled).toBe(false);
  });

  it('selects a wire only when the squared distance is under 10', () => {
    const { circuit } = fresh();
    const gate = createBuiltinElement('NOT', 400, 200);
    circuit.elements.push(gate);
    connectOriented(circuit.inputs[0], gate.inputs[0]);
    circuit.inputs[0].x = 0;
    circuit.inputs[0].y = 0;
    gate.inputs[0].x = 100;
    gate.inputs[0].y = 0;

    expect(selectLineAt(circuit, 50, 3)).toBe(true);
    expect(circuit.selectedLineFrom).toBe(circuit.inputs[0]);
    unselectLines(circuit);
    expect(selectLineAt(circuit, 50, 4)).toBe(false);
    expect(circuit.selectedLineFrom).toBeNull();
  });

  it('refuses a direct field-input to field-output wire', () => {
    const { circuit, session } = fresh();
    wire(circuit, session, circuit.inputs[0], circuit.outputs[0]);
    expect(circuit.inputs[0].next).toHaveLength(0);
    expect(circuit.outputs[0].prev).toBeNull();
  });
});

describe('simulation', () => {
  it('settles a forward chain in one pass and a reversed chain over later passes', () => {
    const { circuit } = fresh();
    const first = createBuiltinElement('NOT', 300, 200);
    const second = createBuiltinElement('NOT', 520, 200);
    circuit.elements.push(first, second);
    connectOriented(circuit.inputs[0], first.inputs[0]);
    connectOriented(first.outputs[0], second.inputs[0]);
    connectOriented(second.outputs[0], circuit.outputs[0]);
    circuit.inputs[0].signaled = true;
    first.inputs[0].signaled = true;
    stepSimulation(circuit);
    expect(circuit.outputs[0].signaled).toBe(true);

    const reversed = createInitialCircuit(layout);
    const nearSink = createBuiltinElement('NOT', 520, 200);
    const nearSource = createBuiltinElement('NOT', 300, 200);
    reversed.elements.push(nearSink, nearSource);
    connectOriented(reversed.inputs[0], nearSource.inputs[0]);
    connectOriented(nearSource.outputs[0], nearSink.inputs[0]);
    connectOriented(nearSink.outputs[0], reversed.outputs[0]);
    stepSimulation(reversed);
    expect(reversed.outputs[0].signaled).toBe(true);
    stepSimulation(reversed);
    expect(reversed.outputs[0].signaled).toBe(false);
  });

  it('bakes a truth table by settling ten ticks per input row', () => {
    const { circuit } = fresh();
    const nearSink = createBuiltinElement('NOT', 520, 200);
    const nearSource = createBuiltinElement('NOT', 300, 200);
    circuit.elements.push(nearSink, nearSource);
    connectOriented(circuit.inputs[0], nearSource.inputs[0]);
    connectOriented(nearSource.outputs[0], nearSink.inputs[0]);
    connectOriented(nearSink.outputs[0], circuit.outputs[0]);

    expect(enumerateCombinations(2)).toEqual([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ]);
    const template = sampleCustomTemplate(circuit, 'BUF');
    expect(template.results).toEqual([[false], [false], [true], [true]]);
    expect(circuit.inputs.map((pin) => pin.signaled)).toEqual([true, true]);

    const copy = instantiateCustom(template, 400, 200);
    copy.inputs[0].signaled = true;
    copy.inputs[1].signaled = false;
    stepSimulation({ elements: [copy] });
    expect(copy.outputs[0].signaled).toBe(true);
  });

  it('leaves the sampled signals in place when the new toolbar button does not fit', () => {
    const { circuit } = fresh();
    circuit.lastElementX = layout.fieldEndX - 10;
    expect(addCustomElementToBar(circuit, layout, 'NOPE')).toBe(false);
    expect(circuit.elementsOnBar.some((item) => item.name === 'NOPE')).toBe(false);
    expect(circuit.inputs.map((pin) => pin.signaled)).toEqual([true, true]);
  });
});

describe('pointer interaction', () => {
  it('adds and removes pins from the plus and minus buttons', () => {
    const { circuit, session } = fresh();
    pointerDown(circuit, layout, session, layout.plusInputX, layout.plusInputY);
    expect(circuit.inputs).toHaveLength(3);
    pointerDown(circuit, layout, session, layout.minusInputX + 29, layout.minusInputY + 29);
    expect(circuit.inputs).toHaveLength(2);
    pointerDown(circuit, layout, session, layout.plusOutputX + 29, layout.plusOutputY + 29);
    expect(circuit.outputs).toHaveLength(2);
    pointerDown(circuit, layout, session, layout.minusOutputX, layout.minusOutputY);
    expect(circuit.outputs).toHaveLength(1);
  });

  it('toggles a field input from its outer circle and not from the rim', () => {
    const { circuit, session } = fresh();
    pointerDown(circuit, layout, session, circuit.inputs[0].fieldX, circuit.inputs[0].y);
    expect(circuit.inputs[0].signaled).toBe(true);
    expect(session.drawing).toBe(false);
    pointerDown(circuit, layout, session, circuit.inputs[0].fieldX + 20, circuit.inputs[0].y);
    expect(circuit.inputs[0].signaled).toBe(true);
  });

  it('places an AND gate, wires it, and simulates the output', () => {
    const { circuit, session } = fresh();
    const and = place(circuit, session, 'AND', 400, 200);
    expect(and.kind).toBe('AND');
    expect(and.x).toBe(400);
    expect(and.y).toBe(200);

    wire(circuit, session, circuit.inputs[0], and.inputs[0]);
    wire(circuit, session, circuit.inputs[1], and.inputs[1]);
    pointerDown(circuit, layout, session, circuit.inputs[0].fieldX, circuit.inputs[0].y);
    pointerDown(circuit, layout, session, circuit.inputs[1].fieldX, circuit.inputs[1].y);
    expect(and.inputs.map((pin) => pin.signaled)).toEqual([true, true]);
    stepSimulation(circuit);
    expect(and.outputs[0].signaled).toBe(true);

    wire(circuit, session, and.outputs[0], circuit.outputs[0]);
    expect(circuit.outputs[0].signaled).toBe(true);
    pointerDown(circuit, layout, session, circuit.inputs[0].fieldX, circuit.inputs[0].y);
    stepSimulation(circuit);
    expect(circuit.outputs[0].signaled).toBe(false);
  });

  it('does not place a gate when the pointer never moves or the drop is outside the field', () => {
    const { circuit, session } = fresh();
    const button = circuit.elementsOnBar.find((item) => item.name === 'OR');
    if (!button) {
      throw new Error('missing OR');
    }
    pointerDown(circuit, layout, session, button.x + 4, button.y + 4);
    pointerUp(circuit, layout, session, button.x + 4, button.y + 4);
    expect(circuit.elements).toHaveLength(0);
    expect(session.spawning).toBe(false);

    pointerDown(circuit, layout, session, button.x + 4, button.y + 4);
    pointerMove(circuit, layout, session, 20, 20);
    pointerUp(circuit, layout, session, 20, 20);
    expect(circuit.elements).toHaveLength(0);
  });

  it('moves a selected gate and ignores drags that would leave the field', () => {
    const { circuit, session } = fresh();
    const and = place(circuit, session, 'AND', 400, 200);
    pointerDown(circuit, layout, session, 486, 240);
    expect(circuit.selectedElement).toBe(and);
    pointerMove(circuit, layout, session, 516, 260);
    expect(and.x).toBe(430);
    expect(and.y).toBe(220);
    expect(and.inputs[0].x).toBe(430);
    pointerMove(circuit, layout, session, 100, 260);
    expect(and.x).toBe(430);
    pointerLeave(circuit, session);
    pointerMove(circuit, layout, session, 700, 400);
    expect(and.x).toBe(430);
    expect(and.selected).toBe(true);
  });

  it('selects the topmost gate and deletes it together with its wires', () => {
    const { circuit, session } = fresh();
    const lower = createBuiltinElement('AND', 400, 200);
    const upper = createBuiltinElement('OR', 420, 210);
    circuit.elements.push(lower, upper);
    pointerDown(circuit, layout, session, 500, 250);
    expect(circuit.selectedElement).toBe(upper);

    connectOriented(circuit.inputs[0], upper.inputs[0]);
    connectOriented(upper.outputs[0], circuit.outputs[0]);
    circuit.outputs[0].signaled = true;
    deleteSelection(circuit);
    expect(circuit.elements).toEqual([lower]);
    expect(circuit.inputs[0].next).toHaveLength(0);
    expect(circuit.outputs[0].prev).toBeNull();
    expect(circuit.outputs[0].signaled).toBe(false);
  });

  it('deletes a selected wire and detaches a sink while redrawing it', () => {
    const { circuit, session } = fresh();
    const not = place(circuit, session, 'NOT', 400, 200);
    wire(circuit, session, circuit.inputs[0], not.inputs[0]);
    circuit.inputs[0].signaled = true;
    not.inputs[0].signaled = true;

    const midX = (circuit.inputs[0].x + not.inputs[0].x) / 2;
    const midY = (circuit.inputs[0].y + not.inputs[0].y) / 2;
    pointerDown(circuit, layout, session, midX, midY);
    expect(circuit.selectedLineFrom).toBe(circuit.inputs[0]);
    deleteSelection(circuit);
    expect(circuit.inputs[0].next).toHaveLength(0);
    expect(not.inputs[0].signaled).toBe(false);

    wire(circuit, session, circuit.inputs[0], not.inputs[0]);
    pointerDown(circuit, layout, session, not.inputs[0].x, not.inputs[0].y);
    expect(not.inputs[0].prev).toBe(circuit.inputs[0]);
    pointerMove(circuit, layout, session, not.inputs[0].x + 30, not.inputs[0].y);
    expect(not.inputs[0].prev).toBeNull();
    expect(circuit.inputs[0].next).toHaveLength(0);
    expect(circuit.line).toEqual([
      not.inputs[0].x + 30,
      not.inputs[0].y,
      not.inputs[0].x,
      not.inputs[0].y,
    ]);
    pointerLeave(circuit, session);
    expect(circuit.line).toBeNull();
  });

  it('opens the name modal from CREATE and bakes a custom NOT', () => {
    const { circuit, session } = fresh();
    const not = place(circuit, session, 'NOT', 400, 200);
    wire(circuit, session, circuit.inputs[0], not.inputs[0]);
    wire(circuit, session, not.outputs[0], circuit.outputs[0]);

    const create = circuit.elementsOnBar[0];
    expect(pointerDown(circuit, layout, session, create.x + 10, create.y + 10)).toBe('modal');
    circuit.creatingElementName = 'INV';
    confirmCreatingElement(circuit, layout, session);

    expect(circuit.elements).toHaveLength(0);
    expect(circuit.inputs).toHaveLength(2);
    expect(circuit.inputs.every((pin) => pin.signaled === false)).toBe(true);
    const inv = place(circuit, session, 'INV', 400, 200);
    expect(inv.kind).toBe('CUSTOM');
    expect(inv.inputs).toHaveLength(2);
    wire(circuit, session, circuit.inputs[0], inv.inputs[0]);
    wire(circuit, session, inv.outputs[0], circuit.outputs[0]);
    stepSimulation(circuit);
    expect(circuit.outputs[0].signaled).toBe(true);
    pointerDown(circuit, layout, session, circuit.inputs[0].fieldX, circuit.inputs[0].y);
    stepSimulation(circuit);
    expect(circuit.outputs[0].signaled).toBe(false);
  });

  it('treats a toolbar button named CREATE as the name modal', () => {
    const { circuit, session } = fresh();
    let received: number | string | undefined;
    circuit.elementsOnBar.push({
      name: 'CREATE',
      x: 900,
      y: 750,
      width: 80,
      height: 40,
      createElement: (name) => {
        received = name;
        return false;
      },
    });
    expect(pointerDown(circuit, layout, session, 910, 760)).toBe('modal');
    circuit.creatingElementName = 'Z';
    confirmCreatingElement(circuit, layout, session);
    expect(received).toBe('Z');
    expect(circuit.elements).toHaveLength(0);
  });
});

describe('drawing', () => {
  it('paints the initial board without throwing', () => {
    const ops: string[] = [];
    const context = new Proxy(
      {},
      {
        get(_target, property) {
          if (property === 'canvas') {
            return {};
          }
          return () => {
            ops.push(String(property));
          };
        },
        set() {
          return true;
        },
      },
    );
    const canvas = {
      width: layout.viewportWidth,
      height: layout.viewportHeight,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const { circuit, session } = fresh();
    drawScene(canvas, circuit, layout);
    place(circuit, session, 'XOR', 400, 200);
    wire(circuit, session, circuit.inputs[0], circuit.elements[0].inputs[0]);
    circuit.elements[0].selected = true;
    circuit.inputs[0].selectedNext = circuit.inputs[0].next[0];
    circuit.line = [10, 10, 20, 20];
    circuit.spawningElement = { name: 'XOR', x: 10, y: 10, width: 40, height: 40 };
    drawScene(canvas, circuit, layout);
    expect(ops).toContain('fillRect');
    expect(ops).toContain('arc');
    expect(ops).toContain('fillText');
    expect(ops).toContain('stroke');
  });
});
