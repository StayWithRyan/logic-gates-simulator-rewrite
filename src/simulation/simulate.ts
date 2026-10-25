import { applyElementSignal } from './gates';
import type { Circuit } from './types';

/**
 * One left-to-right pass, matching the original 10ms `updateGates` tick.
 * BIT latches keep `storedBit` on the element between passes.
 */
export function stepSimulation(circuit: Pick<Circuit, 'elements'>): void {
  for (const element of circuit.elements) {
    applyElementSignal(element);
  }
}

/** Custom elements bake the circuit by repeating a tick this many times per input row. */
export const CUSTOM_SETTLE_TICKS = 10;

export const SIMULATION_INTERVAL_MS = 10;
