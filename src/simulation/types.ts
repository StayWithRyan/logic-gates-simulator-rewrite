export type CombinationalKind = 'AND' | 'OR' | 'NOT' | 'XOR';
export type BuiltinKind = CombinationalKind | 'BIT' | 'ADD2';
export type ElementKind = BuiltinKind | 'CUSTOM';

export interface SinkPort {
  kind: 'field-output' | 'gate-input';
  x: number;
  y: number;
  signaled: boolean;
  prev: SourcePort | null;
}

export interface SourcePort {
  kind: 'field-input' | 'gate-output';
  x: number;
  y: number;
  signaled: boolean;
  next: SinkPort[];
  selectedNext: SinkPort | null;
}

export interface FieldInput extends SourcePort {
  kind: 'field-input';
  fieldX: number;
}

export interface FieldOutput extends SinkPort {
  kind: 'field-output';
  fieldX: number;
}

export interface GateInput extends SinkPort {
  kind: 'gate-input';
  /** Short name drawn inside the gate. Empty when the pin is unlabeled. */
  label: string;
}

export interface GateOutput extends SourcePort {
  kind: 'gate-output';
  /** Short name drawn inside the gate. Empty when the pin is unlabeled. */
  label: string;
}

export type IoNode = FieldInput | FieldOutput | GateInput | GateOutput;

export interface LogicElement {
  kind: ElementKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: GateInput[];
  outputs: GateOutput[];
  selected: boolean;
  color: string;
  selectedColor: string;
  inputsCount: number;
  outputsCount: number;
  combinations: boolean[][];
  results: boolean[][];
  /**
   * Bit remembered by a BIT latch between simulation ticks.
   * Combinational elements leave this false.
   */
  storedBit: boolean;
}

/** Toolbar factories return a gate, or false when a custom element does not fit. */
export type BarCreate = (a: number | string, b?: number) => LogicElement | boolean;

export interface BarItem {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createElement: BarCreate;
}

export interface SpawnPreview {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circuit {
  inputs: FieldInput[];
  outputs: FieldOutput[];
  elements: LogicElement[];
  elementsOnBar: BarItem[];
  lastElementX: number;
  line: [number, number, number, number] | null;
  spawningElement: SpawnPreview | null;
  selectedElement: LogicElement | null;
  selectedLineFrom: SourcePort | null;
  creatingElementName: string;
}

export function isFieldInput(node: IoNode): node is FieldInput {
  return node.kind === 'field-input';
}

export function isFieldOutput(node: IoNode): node is FieldOutput {
  return node.kind === 'field-output';
}

export function isGateInput(node: IoNode): node is GateInput {
  return node.kind === 'gate-input';
}

export function isGateOutput(node: IoNode): node is GateOutput {
  return node.kind === 'gate-output';
}

export function isSourcePort(node: IoNode): node is FieldInput | GateOutput {
  return node.kind === 'field-input' || node.kind === 'gate-output';
}

export function isSinkPort(node: IoNode): node is FieldOutput | GateInput {
  return node.kind === 'field-output' || node.kind === 'gate-input';
}
