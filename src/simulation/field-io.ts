import { FIELD_IO_GAP, FIELD_IO_SIZE, type Layout } from '../layout';
import { deleteNext } from './gates';
import type { Circuit, FieldInput, FieldOutput } from './types';

export function fieldIoBarHeight(count: number): number {
  return count * FIELD_IO_SIZE + (count - 1) * FIELD_IO_GAP;
}

/** Original refuses another pin when `bar + gap + size + 200` exceeds the field height. */
export function canAddFieldIo(currentCount: number, fieldHeight: number): boolean {
  return !(fieldIoBarHeight(currentCount) + FIELD_IO_GAP + FIELD_IO_SIZE + 200 > fieldHeight);
}

function createFieldInput(layout: Layout): FieldInput {
  return {
    kind: 'field-input',
    x: layout.fieldBeginX + 70,
    fieldX: layout.fieldBeginX,
    y: 0,
    signaled: false,
    next: [],
    selectedNext: null,
  };
}

function createFieldOutput(layout: Layout): FieldOutput {
  return {
    kind: 'field-output',
    fieldX: layout.fieldEndX,
    x: layout.fieldEndX - 70,
    y: 0,
    signaled: false,
    prev: null,
  };
}

export function positionFieldInputs(inputs: FieldInput[], layout: Layout): void {
  let y =
    layout.fieldBeginY +
    (layout.fieldHeight - fieldIoBarHeight(inputs.length)) / 2 +
    FIELD_IO_SIZE / 2;
  for (const input of inputs) {
    input.y = y;
    y += FIELD_IO_GAP + FIELD_IO_SIZE;
  }
}

export function positionFieldOutputs(outputs: FieldOutput[], layout: Layout): void {
  let y =
    layout.fieldBeginY +
    (layout.fieldHeight - fieldIoBarHeight(outputs.length)) / 2 +
    FIELD_IO_SIZE / 2;
  for (const output of outputs) {
    output.y = y;
    y += FIELD_IO_GAP + FIELD_IO_SIZE;
  }
}

export function addFieldInput(circuit: Circuit, layout: Layout): void {
  if (!canAddFieldIo(circuit.inputs.length, layout.fieldHeight)) {
    return;
  }
  circuit.inputs.push(createFieldInput(layout));
  positionFieldInputs(circuit.inputs, layout);
}

export function removeFieldInput(circuit: Circuit, layout: Layout): void {
  if (circuit.inputs.length <= 1) {
    return;
  }
  const removed = circuit.inputs[circuit.inputs.length - 1];
  for (const next of removed.next) {
    next.prev = null;
    next.signaled = false;
  }
  circuit.inputs.pop();
  positionFieldInputs(circuit.inputs, layout);
}

export function addFieldOutput(circuit: Circuit, layout: Layout): void {
  if (!canAddFieldIo(circuit.outputs.length, layout.fieldHeight)) {
    return;
  }
  circuit.outputs.push(createFieldOutput(layout));
  positionFieldOutputs(circuit.outputs, layout);
}

export function removeFieldOutput(circuit: Circuit, layout: Layout): void {
  if (circuit.outputs.length <= 1) {
    return;
  }
  const removed = circuit.outputs[circuit.outputs.length - 1];
  if (removed.prev) {
    deleteNext(removed.prev, removed);
  }
  circuit.outputs.pop();
  positionFieldOutputs(circuit.outputs, layout);
}
