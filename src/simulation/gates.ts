import { COLORS, GATE_IO_MARGIN, GATE_IO_SIZE } from '../layout';
import type {
  BuiltinKind,
  CombinationalKind,
  ElementKind,
  GateInput,
  GateOutput,
  LogicElement,
  SourcePort,
} from './types';

const INPUT_COUNTS: Record<BuiltinKind, number> = {
  AND: 2,
  OR: 2,
  NOT: 1,
  XOR: 2,
  BIT: 2,
  ADD2: 5,
};

const OUTPUT_COUNTS: Record<BuiltinKind, number> = {
  AND: 1,
  OR: 1,
  NOT: 1,
  XOR: 1,
  BIT: 1,
  ADD2: 3,
};

/** Top-to-bottom pin names. Empty entries stay unlabeled, matching the original gates. */
const INPUT_LABELS: Record<BuiltinKind, readonly string[]> = {
  AND: [],
  OR: [],
  NOT: [],
  XOR: [],
  BIT: ['D', 'EN'],
  ADD2: ['A1', 'A0', 'B1', 'B0', 'Cin'],
};

const OUTPUT_LABELS: Record<BuiltinKind, readonly string[]> = {
  AND: [],
  OR: [],
  NOT: [],
  XOR: [],
  BIT: ['Q'],
  ADD2: ['S1', 'S0', 'Cout'],
};

const GATE_COLORS: Record<BuiltinKind, { color: string; selected: string }> = {
  AND: { color: COLORS.andElementsColor, selected: COLORS.andElementsSelectedColor },
  OR: { color: COLORS.orElementsColor, selected: COLORS.orElementsSelectedColor },
  NOT: { color: COLORS.notElementsColor, selected: COLORS.notElementsSelectedColor },
  XOR: { color: COLORS.xorElementsColor, selected: COLORS.xorElementsSelectedColor },
  BIT: { color: COLORS.bitElementsColor, selected: COLORS.bitElementsSelectedColor },
  ADD2: { color: COLORS.addElementsColor, selected: COLORS.addElementsSelectedColor },
};

/** Extra body width so ADD2's Cin/Cout labels sit clear of the centered title. */
const ADD2_BODY_PADDING = 48;

export function gateWidth(name: string): number {
  return name.length * 24 + 100;
}

export function barButtonWidth(name: string): number {
  return name.length * 24 + 30;
}

export function gateHeight(ioMax: number): number {
  return GATE_IO_MARGIN + (GATE_IO_MARGIN + GATE_IO_SIZE) * ioMax;
}

/** Boolean gate functions. Loops match the original (no short-circuit). */
export function gateLogic(kind: CombinationalKind, inputs: boolean[]): boolean {
  switch (kind) {
    case 'AND': {
      let result = true;
      for (const input of inputs) {
        if (!input) {
          result = false;
        }
      }
      return result;
    }
    case 'OR': {
      let result = false;
      for (const input of inputs) {
        if (input) {
          result = true;
        }
      }
      return result;
    }
    case 'NOT':
      return !inputs[0];
    case 'XOR':
      return inputs[0] !== inputs[1];
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export function driveSource(source: SourcePort, value: boolean): void {
  source.signaled = value;
  for (const next of source.next) {
    next.signaled = value;
  }
}

export function deleteNext(source: SourcePort, sink: SourcePort['next'][number]): void {
  for (let i = 0; i < source.next.length; i++) {
    if (source.next[i] === sink) {
      source.next.splice(i, 1);
      return;
    }
  }
}

export function layoutElement(element: LogicElement, x: number, y: number): void {
  element.x = x;
  element.y = y;

  const inputsBar =
    element.inputs.length * GATE_IO_SIZE + (element.inputs.length + 1) * GATE_IO_MARGIN;
  const outputsBar =
    element.outputs.length * GATE_IO_SIZE + (element.outputs.length + 1) * GATE_IO_MARGIN;

  let inputY =
    y + (element.height - inputsBar) / 2 + GATE_IO_SIZE / 2 + GATE_IO_MARGIN;
  for (const input of element.inputs) {
    input.x = x;
    input.y = inputY;
    inputY += GATE_IO_MARGIN + GATE_IO_SIZE;
  }

  let outputY =
    y + (element.height - outputsBar) / 2 + GATE_IO_SIZE / 2 + GATE_IO_MARGIN;
  for (const output of element.outputs) {
    output.x = x + element.width;
    output.y = outputY;
    outputY += GATE_IO_MARGIN + GATE_IO_SIZE;
  }
}

interface ElementSpec {
  kind: ElementKind;
  name: string;
  inputCount: number;
  outputCount: number;
  inputLabels: readonly string[];
  outputLabels: readonly string[];
  extraWidth: number;
  color: string;
  selectedColor: string;
  combinations: boolean[][];
  results: boolean[][];
}

function createShell(spec: ElementSpec): LogicElement {
  const inputs: GateInput[] = [];
  for (let i = 0; i < spec.inputCount; i++) {
    inputs.push({
      kind: 'gate-input',
      x: 0,
      y: 0,
      signaled: false,
      prev: null,
      label: spec.inputLabels[i] ?? '',
    });
  }
  const outputs: GateOutput[] = [];
  for (let i = 0; i < spec.outputCount; i++) {
    outputs.push({
      kind: 'gate-output',
      x: 0,
      y: 0,
      signaled: false,
      next: [],
      selectedNext: null,
      label: spec.outputLabels[i] ?? '',
    });
  }
  return {
    kind: spec.kind,
    name: spec.name,
    x: 0,
    y: 0,
    width: gateWidth(spec.name) + spec.extraWidth,
    height: gateHeight(Math.max(spec.inputCount, spec.outputCount)),
    inputs,
    outputs,
    selected: false,
    color: spec.color,
    selectedColor: spec.selectedColor,
    inputsCount: spec.inputCount,
    outputsCount: spec.outputCount,
    combinations: spec.combinations,
    results: spec.results,
    storedBit: false,
  };
}

export function createBuiltinElement(kind: BuiltinKind, x: number, y: number): LogicElement {
  const colors = GATE_COLORS[kind];
  const element = createShell({
    kind,
    name: kind,
    inputCount: INPUT_COUNTS[kind],
    outputCount: OUTPUT_COUNTS[kind],
    inputLabels: INPUT_LABELS[kind],
    outputLabels: OUTPUT_LABELS[kind],
    extraWidth: kind === 'ADD2' ? ADD2_BODY_PADDING : 0,
    color: colors.color,
    selectedColor: colors.selected,
    combinations: [],
    results: [],
  });
  layoutElement(element, x, y);
  return element;
}

export interface CustomTemplate {
  name: string;
  inputsCount: number;
  outputsCount: number;
  combinations: boolean[][];
  results: boolean[][];
}

export function instantiateCustom(template: CustomTemplate, x: number, y: number): LogicElement {
  const element = createShell({
    kind: 'CUSTOM',
    name: template.name,
    inputCount: template.inputsCount,
    outputCount: template.outputsCount,
    inputLabels: [],
    outputLabels: [],
    extraWidth: 0,
    color: COLORS.elementsColor,
    selectedColor: COLORS.elementsSelectedColor,
    combinations: template.combinations,
    results: template.results,
  });
  layoutElement(element, x, y);
  return element;
}

function applyCustomSignal(element: LogicElement): void {
  const current: boolean[] = [];
  for (let i = 0; i < element.inputsCount; i++) {
    current.push(element.inputs[i].signaled);
  }
  for (let i = 0; i < element.combinations.length; i++) {
    let found = true;
    for (let j = 0; j < element.inputsCount; j++) {
      if (element.combinations[i][j] !== current[j]) {
        found = false;
      }
    }
    if (found) {
      for (let j = 0; j < element.outputsCount; j++) {
        driveSource(element.outputs[j], element.results[i][j]);
      }
    }
  }
}

/**
 * BIT is a level-sensitive D latch. Pins, top to bottom: D, EN, and output Q.
 * While EN is high, this tick stores D and drives Q with it. While EN is low,
 * Q keeps the bit stored on the element and D is ignored. The bit starts at 0.
 * Q updates in element-list order, same as the other gates.
 */
function applyBitStore(element: LogicElement): void {
  if (element.inputs[1].signaled) {
    element.storedBit = element.inputs[0].signaled;
  }
  driveSource(element.outputs[0], element.storedBit);
}

/**
 * ADD2 adds two 2-bit numbers and a carry-in.
 * Inputs, top to bottom: A1, A0, B1, B0, Cin. A1 and B1 are the high bits.
 * Outputs, top to bottom: S1, S0, Cout. Sum = A + B + Cin, in 0..7.
 */
function applyAdd2(element: LogicElement): void {
  const a1 = element.inputs[0].signaled;
  const a0 = element.inputs[1].signaled;
  const b1 = element.inputs[2].signaled;
  const b0 = element.inputs[3].signaled;
  const cin = element.inputs[4].signaled;
  const low = (a0 ? 1 : 0) + (b0 ? 1 : 0) + (cin ? 1 : 0);
  const high = (low >> 1) + (a1 ? 1 : 0) + (b1 ? 1 : 0);
  driveSource(element.outputs[0], (high & 1) === 1);
  driveSource(element.outputs[1], (low & 1) === 1);
  driveSource(element.outputs[2], (high >> 1) === 1);
}

export function applyElementSignal(element: LogicElement): void {
  switch (element.kind) {
    case 'CUSTOM':
      applyCustomSignal(element);
      return;
    case 'BIT':
      applyBitStore(element);
      return;
    case 'ADD2':
      applyAdd2(element);
      return;
    case 'AND':
    case 'OR':
    case 'NOT':
    case 'XOR': {
      const inputs = element.inputs.map((input) => input.signaled);
      driveSource(element.outputs[0], gateLogic(element.kind, inputs));
      return;
    }
    default: {
      const unreachable: never = element.kind;
      return unreachable;
    }
  }
}
