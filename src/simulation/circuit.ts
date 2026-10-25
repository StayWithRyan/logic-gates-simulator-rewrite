import type { Layout } from '../layout';
import { addElementToBar } from './bar';
import { addCustomElementToBar } from './custom';
import { addFieldInput, addFieldOutput } from './field-io';
import { createBuiltinElement } from './gates';
import type { BuiltinKind, Circuit } from './types';

function spawnBuiltin(kind: BuiltinKind) {
  return (xOrName: number | string, y?: number) =>
    createBuiltinElement(
      kind,
      typeof xOrName === 'number' ? xOrName : Number.NaN,
      y ?? Number.NaN,
    );
}

export function createInitialCircuit(layout: Layout): Circuit {
  const circuit: Circuit = {
    inputs: [],
    outputs: [],
    elements: [],
    elementsOnBar: [],
    lastElementX: layout.fieldBeginX,
    line: null,
    spawningElement: null,
    selectedElement: null,
    selectedLineFrom: null,
    creatingElementName: '',
  };
  addFieldInput(circuit, layout);
  addFieldInput(circuit, layout);
  addFieldOutput(circuit, layout);
  addElementToBar(circuit, layout, 'CREATE', (name) =>
    addCustomElementToBar(circuit, layout, String(name)),
  );
  addElementToBar(circuit, layout, 'OR', spawnBuiltin('OR'));
  addElementToBar(circuit, layout, 'AND', spawnBuiltin('AND'));
  addElementToBar(circuit, layout, 'NOT', spawnBuiltin('NOT'));
  addElementToBar(circuit, layout, 'XOR', spawnBuiltin('XOR'));
  addElementToBar(circuit, layout, 'BIT', spawnBuiltin('BIT'));
  addElementToBar(circuit, layout, 'ADD2', spawnBuiltin('ADD2'));
  return circuit;
}

/** Resets the board to two inputs and one output. Toolbar buttons stay. */
export function clearField(circuit: Circuit, layout: Layout): void {
  circuit.inputs = [];
  addFieldInput(circuit, layout);
  addFieldInput(circuit, layout);
  circuit.outputs = [];
  addFieldOutput(circuit, layout);
  circuit.elements = [];
  circuit.selectedElement = null;
  circuit.selectedLineFrom = null;
  circuit.line = null;
  circuit.spawningElement = null;
}
