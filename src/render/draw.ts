import { BUTTON_SIZE, type Layout } from '../layout';
import type { Circuit, SinkPort, SourcePort, SpawnPreview } from '../simulation/types';
import { colorsForKind, CLASSIC_PALETTE, type Palette } from '../theme/palettes';

const LABEL_FONT = '36px Roboto Mono';
const LABEL_COLOR = 'white';
const PIN_COLOR = 'black';

function paintLabel(
  context: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.font = LABEL_FONT;
  context.fillStyle = LABEL_COLOR;
  context.fillText(name, x + (width - name.length * 22) / 2, y + height / 2 + 12);
}

function paintWire(
  context: CanvasRenderingContext2D,
  source: SourcePort,
  next: SinkPort,
  palette: Palette,
): void {
  if (source.selectedNext === next) {
    context.beginPath();
    context.lineWidth = 9;
    context.strokeStyle = palette.orElementsSelectedColor;
    context.moveTo(source.x, source.y);
    context.lineTo(next.x, next.y);
    context.stroke();
  }
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = source.signaled ? palette.signalColor : palette.noSignalColor;
  context.moveTo(source.x, source.y);
  context.lineTo(next.x, next.y);
  context.stroke();
}

function paintFieldBody(
  context: CanvasRenderingContext2D,
  fieldX: number,
  nodeX: number,
  y: number,
  signaled: boolean,
  palette: Palette,
): void {
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = PIN_COLOR;
  context.moveTo(fieldX, y);
  context.lineTo(nodeX, y);
  context.stroke();

  context.beginPath();
  context.fillStyle = signaled ? palette.signalColor : palette.noSignalColor;
  context.arc(fieldX, y, 20, 0, Math.PI * 2, false);
  context.fill();

  context.beginPath();
  context.fillStyle = PIN_COLOR;
  context.arc(nodeX, y, 12.5, 0, Math.PI * 2, false);
  context.fill();
}

function paintBarButton(
  context: CanvasRenderingContext2D,
  element: SpawnPreview,
  palette: Palette,
): void {
  context.fillStyle = palette.fieldBorderColor;
  context.fillRect(element.x, element.y, element.width, element.height);
  paintLabel(context, element.name, element.x, element.y, element.width, element.height);
}

function paintPlus(context: CanvasRenderingContext2D, x: number, y: number, palette: Palette): void {
  const size = BUTTON_SIZE;
  context.fillStyle = palette.elementsColor;
  context.fillRect(x + 10, y, size - 20, size);
  context.fillRect(x, y + 10, size, size - 20);
  context.fillStyle = palette.elementsSelectedColor;
  context.fillRect(x + 12, y + 2, size - 24, size - 4);
  context.fillRect(x + 2, y + 12, size - 4, size - 24);
}

function paintMinus(context: CanvasRenderingContext2D, x: number, y: number, palette: Palette): void {
  const size = BUTTON_SIZE;
  context.fillStyle = palette.elementsColor;
  context.fillRect(x, y + 10, size, size - 20);
  context.fillStyle = palette.elementsSelectedColor;
  context.fillRect(x + 2, y + 12, size - 4, size - 24);
}

function paintHood(context: CanvasRenderingContext2D, layout: Layout, palette: Palette): void {
  context.fillStyle = palette.backgroundColor;
  context.fillRect(0, 0, layout.viewportWidth, layout.viewportHeight);

  context.fillStyle = palette.fieldColor;
  context.fillRect(layout.fieldBeginX, layout.fieldBeginY, layout.fieldWidth, layout.fieldHeight);

  context.fillStyle = palette.componentsBackgroundColor;
  context.fillRect(0, layout.fieldEndY + 20, layout.viewportWidth, 60);

  context.strokeStyle = palette.fieldBorderColor;
  context.lineWidth = 5;
  context.strokeRect(layout.fieldBeginX, layout.fieldBeginY, layout.fieldWidth, layout.fieldHeight);

  paintPlus(context, layout.plusInputX, layout.plusInputY, palette);
  paintMinus(context, layout.minusInputX, layout.minusInputY, palette);
  paintPlus(context, layout.plusOutputX, layout.plusOutputY, palette);
  paintMinus(context, layout.minusOutputX, layout.minusOutputY, palette);
}

function paintDragLine(
  context: CanvasRenderingContext2D,
  line: [number, number, number, number],
  palette: Palette,
): void {
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = palette.noSignalColor;
  context.moveTo(line[0], line[1]);
  context.lineTo(line[2], line[3]);
  context.stroke();
}

/** Paints one frame. Order matches `drawing.js`: hood, drag line, inputs, wires, gates, outputs, toolbar. */
export function drawScene(
  canvas: HTMLCanvasElement,
  circuit: Circuit,
  layout: Layout,
  palette: Palette = CLASSIC_PALETTE,
): void {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  paintHood(context, layout, palette);
  if (circuit.line) {
    paintDragLine(context, circuit.line, palette);
  }

  for (const input of circuit.inputs) {
    for (const next of input.next) {
      paintWire(context, input, next, palette);
    }
    paintFieldBody(context, input.fieldX, input.x, input.y, input.signaled, palette);
  }

  for (const element of circuit.elements) {
    for (const output of element.outputs) {
      for (const next of output.next) {
        paintWire(context, output, next, palette);
      }
    }
  }

  for (const element of circuit.elements) {
    const colors = colorsForKind(palette, element.kind);
    context.fillStyle = colors.color;
    context.fillRect(element.x, element.y, element.width, element.height);
    if (element.selected) {
      context.strokeStyle = colors.selected;
      context.lineWidth = 5;
      context.strokeRect(element.x, element.y, element.width, element.height);
    }
    for (const input of element.inputs) {
      context.beginPath();
      context.fillStyle = PIN_COLOR;
      context.arc(input.x, input.y, 12.5, 0, Math.PI * 2, false);
      context.fill();
    }
    for (const output of element.outputs) {
      context.beginPath();
      context.fillStyle = PIN_COLOR;
      context.arc(output.x, output.y, 12.5, 0, Math.PI * 2, false);
      context.fill();
    }
    paintLabel(context, element.name, element.x, element.y, element.width, element.height);
  }

  for (const output of circuit.outputs) {
    paintFieldBody(context, output.fieldX, output.x, output.y, output.signaled, palette);
  }

  for (const item of circuit.elementsOnBar) {
    paintBarButton(context, item, palette);
  }
  if (circuit.spawningElement) {
    paintBarButton(context, circuit.spawningElement, palette);
  }
}
