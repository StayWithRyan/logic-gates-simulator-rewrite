import { describe, expect, it } from 'vitest';
import { createBuiltinElement, gateHeight, gateLogic, gateWidth, instantiateCustom, applyElementSignal } from './gates';
import { connectOriented } from './wiring';
import type { BuiltinKind } from './types';

const cases: Record<BuiltinKind, [boolean, boolean, boolean][]> = {
  AND: [
    [false, false, false],
    [false, true, false],
    [true, false, false],
    [true, true, true],
  ],
  OR: [
    [false, false, false],
    [false, true, true],
    [true, false, true],
    [true, true, true],
  ],
  XOR: [
    [false, false, false],
    [false, true, true],
    [true, false, true],
    [true, true, false],
  ],
  NOT: [],
};

describe('gate logic', () => {
  it('evaluates AND, OR, and XOR across every input pair', () => {
    for (const kind of ['AND', 'OR', 'XOR'] as const) {
      for (const [a, b, expected] of cases[kind]) {
        expect(gateLogic(kind, [a, b])).toBe(expected);
      }
    }
  });

  it('evaluates NOT', () => {
    expect(gateLogic('NOT', [false])).toBe(true);
    expect(gateLogic('NOT', [true])).toBe(false);
  });

  it('sizes gates the way the original classes did', () => {
    expect(gateWidth('OR')).toBe(2 * 24 + 100);
    expect(gateWidth('AND')).toBe(3 * 24 + 100);
    expect(gateHeight(1)).toBe(10 + 35);
    expect(gateHeight(2)).toBe(10 + 35 * 2);
  });

  it('places input and output pins on the gate edges', () => {
    const and = createBuiltinElement('AND', 400, 200);
    expect(and.width).toBe(172);
    expect(and.height).toBe(80);
    expect(and.color).toBe('#29739e');
    expect(and.inputs.map((pin) => [pin.x, pin.y])).toEqual([
      [400, 222.5],
      [400, 257.5],
    ]);
    expect(and.outputs.map((pin) => [pin.x, pin.y])).toEqual([[572, 240]]);

    const not = createBuiltinElement('NOT', 10, 50);
    expect(not.height).toBe(45);
    expect(not.inputs[0]).toMatchObject({ x: 10, y: 72.5 });
    expect(not.outputs[0]).toMatchObject({ x: 182, y: 72.5 });
    expect(not.color).toBe('#891f1b');
    expect(createBuiltinElement('OR', 0, 0).color).toBe('#8d4da4');
    expect(createBuiltinElement('XOR', 0, 0).color).toBe('#bb3a78');
    expect(createBuiltinElement('AND', 0, 0).selectedColor).toBe('#497f9e');
  });

  it('pushes a gate result into every downstream pin', () => {
    const and = createBuiltinElement('AND', 0, 0);
    const not = createBuiltinElement('NOT', 200, 0);
    connectOriented(and.outputs[0], not.inputs[0]);
    and.inputs[0].signaled = true;
    and.inputs[1].signaled = true;
    applyElementSignal(and);
    expect(and.outputs[0].signaled).toBe(true);
    expect(not.inputs[0].signaled).toBe(true);
  });

  it('keeps a custom output unchanged until a stored row matches, and the last match wins', () => {
    const custom = instantiateCustom(
      {
        name: 'X',
        inputsCount: 1,
        outputsCount: 1,
        combinations: [[false], [false]],
        results: [[true], [false]],
      },
      0,
      0,
    );
    custom.inputs[0].signaled = true;
    applyElementSignal(custom);
    expect(custom.outputs[0].signaled).toBe(false);

    custom.inputs[0].signaled = false;
    applyElementSignal(custom);
    expect(custom.outputs[0].signaled).toBe(false);
  });
});
