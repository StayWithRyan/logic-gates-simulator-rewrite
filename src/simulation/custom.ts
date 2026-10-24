import type { Layout } from '../layout';
import { addElementToBar } from './bar';
import { instantiateCustom, type CustomTemplate } from './gates';
import { CUSTOM_SETTLE_TICKS, stepSimulation } from './simulate';
import type { Circuit } from './types';

/** Input rows in the original bit order: index 0 is the high bit of the field inputs. */
export function enumerateCombinations(inputCount: number): boolean[][] {
  const combinations: boolean[][] = [];
  for (let i = 0; i < 1 << inputCount; i++) {
    const combination: boolean[] = [];
    for (let j = inputCount - 1; j >= 0; j--) {
      combination.push(!!(i & (1 << j)));
    }
    combinations.push(combination);
  }
  return combinations;
}

/**
 * Drives every field-input combination through the live circuit and records field outputs.
 * Leaves the circuit on the last row, which is what the original did when the new
 * toolbar button did not fit.
 */
export function sampleCustomTemplate(circuit: Circuit, name: string): CustomTemplate {
  const combinations = enumerateCombinations(circuit.inputs.length);
  const results: boolean[][] = [];
  for (let i = 0; i < combinations.length; i++) {
    for (let j = 0; j < circuit.inputs.length; j++) {
      const input = circuit.inputs[j];
      input.signaled = combinations[i][j];
      for (const next of input.next) {
        next.signaled = combinations[i][j];
      }
    }
    for (let tick = 0; tick < CUSTOM_SETTLE_TICKS; tick++) {
      stepSimulation(circuit);
    }
    const result: boolean[] = [];
    for (let j = 0; j < circuit.outputs.length; j++) {
      result.push(circuit.outputs[j].signaled);
    }
    results.push(result);
  }
  return {
    name,
    inputsCount: circuit.inputs.length,
    outputsCount: circuit.outputs.length,
    combinations,
    results,
  };
}

export function addCustomElementToBar(circuit: Circuit, layout: Layout, name: string): boolean {
  const template = sampleCustomTemplate(circuit, name);
  return addElementToBar(circuit, layout, name, (xOrName, y) =>
    instantiateCustom(
      template,
      typeof xOrName === 'number' ? xOrName : Number.NaN,
      y ?? Number.NaN,
    ),
  );
}
