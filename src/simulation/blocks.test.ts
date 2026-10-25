import { describe, expect, it } from 'vitest';
import { createBuiltinElement, gateHeight, gateWidth } from './gates';
import { connectOriented } from './wiring';
import { stepSimulation } from './simulate';

describe('BIT latch', () => {
  it('holds the stored bit across ticks while enable is low', () => {
    const bit = createBuiltinElement('BIT', 0, 0);
    const follower = createBuiltinElement('NOT', 200, 0);
    connectOriented(bit.outputs[0], follower.inputs[0]);
    expect(bit.storedBit).toBe(false);
    expect(bit.inputs.map((pin) => pin.label)).toEqual(['D', 'EN']);
    expect(bit.outputs[0].label).toBe('Q');

    bit.inputs[0].signaled = true;
    bit.inputs[1].signaled = false;
    for (let tick = 0; tick < 5; tick++) {
      stepSimulation({ elements: [bit, follower] });
    }
    expect(bit.storedBit).toBe(false);
    expect(bit.outputs[0].signaled).toBe(false);
    expect(follower.outputs[0].signaled).toBe(true);

    bit.inputs[1].signaled = true;
    stepSimulation({ elements: [bit, follower] });
    expect(bit.storedBit).toBe(true);
    expect(bit.outputs[0].signaled).toBe(true);
    expect(follower.inputs[0].signaled).toBe(true);
    expect(follower.outputs[0].signaled).toBe(false);

    bit.inputs[0].signaled = false;
    bit.inputs[1].signaled = false;
    for (let tick = 0; tick < 8; tick++) {
      stepSimulation({ elements: [bit, follower] });
      expect(bit.storedBit).toBe(true);
      expect(bit.outputs[0].signaled).toBe(true);
      expect(follower.outputs[0].signaled).toBe(false);
    }

    bit.inputs[1].signaled = true;
    stepSimulation({ elements: [bit, follower] });
    expect(bit.storedBit).toBe(false);
    expect(bit.outputs[0].signaled).toBe(false);
    expect(follower.outputs[0].signaled).toBe(true);

    bit.inputs[1].signaled = false;
    bit.inputs[0].signaled = true;
    for (let tick = 0; tick < 3; tick++) {
      stepSimulation({ elements: [bit, follower] });
    }
    expect(bit.storedBit).toBe(false);
    expect(follower.outputs[0].signaled).toBe(true);
  });

  it('keeps each latch bit independent', () => {
    const first = createBuiltinElement('BIT', 0, 0);
    const second = createBuiltinElement('BIT', 200, 0);
    first.inputs[0].signaled = true;
    first.inputs[1].signaled = true;
    second.inputs[0].signaled = true;
    stepSimulation({ elements: [first, second] });
    first.inputs[1].signaled = false;
    first.inputs[0].signaled = false;
    for (let tick = 0; tick < 4; tick++) {
      stepSimulation({ elements: [first, second] });
    }
    expect(first.storedBit).toBe(true);
    expect(second.storedBit).toBe(false);
    expect(second.outputs[0].signaled).toBe(false);
  });
});

describe('ADD2 adder', () => {
  it('sums every 2-bit pair plus carry', () => {
    const adder = createBuiltinElement('ADD2', 400, 200);
    expect(adder.width).toBe(gateWidth('ADD2') + 48);
    expect(adder.height).toBe(gateHeight(5));
    expect(adder.inputs.map((pin) => pin.label)).toEqual(['A1', 'A0', 'B1', 'B0', 'Cin']);
    expect(adder.outputs.map((pin) => pin.label)).toEqual(['S1', 'S0', 'Cout']);
    expect(adder.inputs.map((pin) => [pin.x, pin.y])).toEqual([
      [400, 222.5],
      [400, 257.5],
      [400, 292.5],
      [400, 327.5],
      [400, 362.5],
    ]);
    expect(adder.outputs.map((pin) => [pin.x, pin.y])).toEqual([
      [644, 257.5],
      [644, 292.5],
      [644, 327.5],
    ]);

    for (let a = 0; a < 4; a++) {
      for (let b = 0; b < 4; b++) {
        for (let cin = 0; cin < 2; cin++) {
          const sum = a + b + cin;
          adder.inputs[0].signaled = ((a >> 1) & 1) === 1;
          adder.inputs[1].signaled = (a & 1) === 1;
          adder.inputs[2].signaled = ((b >> 1) & 1) === 1;
          adder.inputs[3].signaled = (b & 1) === 1;
          adder.inputs[4].signaled = cin === 1;
          stepSimulation({ elements: [adder] });
          expect(adder.outputs.map((pin) => pin.signaled)).toEqual([
            ((sum >> 1) & 1) === 1,
            (sum & 1) === 1,
            ((sum >> 2) & 1) === 1,
          ]);
        }
      }
    }
  });
});
