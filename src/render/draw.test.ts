import { describe, expect, it } from 'vitest';
import { createLayout } from '../layout';
import { createInitialCircuit } from '../simulation/circuit';
import { createBuiltinElement } from '../simulation/gates';
import { connectOriented } from '../simulation/wiring';
import { CLASSIC_PALETTE, paletteById } from '../theme/palettes';
import { drawScene } from './draw';

function recordingContext(): {
  canvas: HTMLCanvasElement;
  fills: string[];
  strokes: string[];
} {
  const fills: string[] = [];
  const strokes: string[] = [];
  const context = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'canvas') {
          return {};
        }
        return () => undefined;
      },
      set(_target, property, value) {
        if (property === 'fillStyle') {
          fills.push(String(value));
        }
        if (property === 'strokeStyle') {
          strokes.push(String(value));
        }
        return true;
      },
    },
  );
  const canvas = {
    getContext: () => context,
  } as unknown as HTMLCanvasElement;
  return { canvas, fills, strokes };
}

describe('drawScene palettes', () => {
  it('paints the field, gates, wires, inputs, and toolbar from the active palette', () => {
    const layout = createLayout(1200, 800);
    const circuit = createInitialCircuit(layout);
    const and = createBuiltinElement('AND', 400, 200);
    circuit.elements.push(and);
    circuit.inputs[0].signaled = true;
    connectOriented(circuit.inputs[0], and.inputs[0]);
    and.selected = true;

    const dusk = paletteById('dusk');
    const painted = recordingContext();
    drawScene(painted.canvas, circuit, layout, dusk);

    expect(painted.fills).toContain(dusk.backgroundColor);
    expect(painted.fills).toContain(dusk.fieldColor);
    expect(painted.fills).toContain(dusk.componentsBackgroundColor);
    expect(painted.fills).toContain(dusk.fieldBorderColor);
    expect(painted.fills).toContain(dusk.elementsColor);
    expect(painted.fills).toContain(dusk.andElementsColor);
    expect(painted.fills).toContain(dusk.signalColor);
    expect(painted.fills).toContain(dusk.noSignalColor);
    expect(painted.strokes).toContain(dusk.fieldBorderColor);
    expect(painted.strokes).toContain(dusk.signalColor);
    expect(painted.strokes).toContain(dusk.andElementsSelectedColor);

    const classic = recordingContext();
    drawScene(classic.canvas, circuit, layout);
    expect(classic.fills).toContain(CLASSIC_PALETTE.fieldColor);
    expect(classic.fills).toContain(CLASSIC_PALETTE.andElementsColor);
    expect(classic.fills).not.toContain(dusk.fieldColor);
  });
});
