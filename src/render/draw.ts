import { BUTTON_SIZE, COLORS, type Layout } from '../layout';
import type { Circuit, SinkPort, SourcePort, SpawnPreview } from '../simulation/types';

const LABEL_FONT = '36px Roboto Mono';

function paintLabel(
  context: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.font = LABEL_FONT;
  context.fillStyle = 'white';
  context.fillText(name, x + (width - name.length * 22) / 2, y + height / 2 + 12);
}

function paintWire(
  context: CanvasRenderingContext2D,
  source: SourcePort,
  next: SinkPort,
): void {
  if (source.selectedNext === next) {
    context.beginPath();
    context.lineWidth = 9;
    context.strokeStyle = COLORS.orElementsSelectedColor;
    context.moveTo(source.x, source.y);
    context.lineTo(next.x, next.y);
    context.stroke();
  }
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = source.signaled ? COLORS.signalColor : COLORS.noSignalColor;
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
): void {
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = 'black';
  context.moveTo(fieldX, y);
  context.lineTo(nodeX, y);
  context.stroke();

  context.beginPath();
  context.fillStyle = signaled ? COLORS.signalColor : COLORS.noSignalColor;
  context.arc(fieldX, y, 20, 0, Math.PI * 2, false);
  context.fill();

  context.beginPath();
  context.fillStyle = 'black';
  context.arc(nodeX, y, 12.5, 0, Math.PI * 2, false);
  context.fill();
}

function paintBarButton(context: CanvasRenderingContext2D, element: SpawnPreview): void {
  context.fillStyle = COLORS.fieldBorderColor;
  context.fillRect(element.x, element.y, element.width, element.height);
  paintLabel(context, element.name, element.x, element.y, element.width, element.height);
}

function paintPlus(context: CanvasRenderingContext2D, x: number, y: number): void {
  const size = BUTTON_SIZE;
  context.fillStyle = COLORS.elementsColor;
  context.fillRect(x + 10, y, size - 20, size);
  context.fillRect(x, y + 10, size, size - 20);
  context.fillStyle = COLORS.elementsSelectedColor;
  context.fillRect(x + 12, y + 2, size - 24, size - 4);
  context.fillRect(x + 2, y + 12, size - 4, size - 24);
}

function paintMinus(context: CanvasRenderingContext2D, x: number, y: number): void {
  const size = BUTTON_SIZE;
  context.fillStyle = COLORS.elementsColor;
  context.fillRect(x, y + 10, size, size - 20);
  context.fillStyle = COLORS.elementsSelectedColor;
  context.fillRect(x + 2, y + 12, size - 4, size - 24);
}

function paintHood(context: CanvasRenderingContext2D, layout: Layout): void {
  context.fillStyle = COLORS.backgroundColor;
  context.fillRect(0, 0, layout.viewportWidth, layout.viewportHeight);

  context.fillStyle = COLORS.fieldColor;
  context.fillRect(layout.fieldBeginX, layout.fieldBeginY, layout.fieldWidth, layout.fieldHeight);

  context.fillStyle = COLORS.componentsBackgroundColor;
  context.fillRect(0, layout.fieldEndY + 20, layout.viewportWidth, 60);

  context.strokeStyle = COLORS.fieldBorderColor;
  context.lineWidth = 5;
  context.strokeRect(layout.fieldBeginX, layout.fieldBeginY, layout.fieldWidth, layout.fieldHeight);

  paintPlus(context, layout.plusInputX, layout.plusInputY);
  paintMinus(context, layout.minusInputX, layout.minusInputY);
  paintPlus(context, layout.plusOutputX, layout.plusOutputY);
  paintMinus(context, layout.minusOutputX, layout.minusOutputY);
}

function paintDragLine(
  context: CanvasRenderingContext2D,
  line: [number, number, number, number],
): void {
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = COLORS.noSignalColor;
  context.moveTo(line[0], line[1]);
  context.lineTo(line[2], line[3]);
  context.stroke();
}

/** Paints one frame. Order matches `drawing.js`: hood, drag line, inputs, wires, gates, outputs, toolbar. */
export function drawScene(canvas: HTMLCanvasElement, circuit: Circuit, layout: Layout): void {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  paintHood(context, layout);
  if (circuit.line) {
    paintDragLine(context, circuit.line);
  }

  for (const input of circuit.inputs) {
    for (const next of input.next) {
      paintWire(context, input, next);
    }
    paintFieldBody(context, input.fieldX, input.x, input.y, input.signaled);
  }

  for (const element of circuit.elements) {
    for (const output of element.outputs) {
      for (const next of output.next) {
        paintWire(context, output, next);
      }
    }
  }

  for (const element of circuit.elements) {
    context.fillStyle = element.color;
    context.fillRect(element.x, element.y, element.width, element.height);
    if (element.selected) {
      context.strokeStyle = element.selectedColor;
      context.lineWidth = 5;
      context.strokeRect(element.x, element.y, element.width, element.height);
    }
    for (const input of element.inputs) {
      context.beginPath();
      context.fillStyle = 'black';
      context.arc(input.x, input.y, 12.5, 0, Math.PI * 2, false);
      context.fill();
    }
    for (const output of element.outputs) {
      context.beginPath();
      context.fillStyle = 'black';
      context.arc(output.x, output.y, 12.5, 0, Math.PI * 2, false);
      context.fill();
    }
    paintLabel(context, element.name, element.x, element.y, element.width, element.height);
  }

  for (const output of circuit.outputs) {
    paintFieldBody(context, output.fieldX, output.x, output.y, output.signaled);
  }

  for (const item of circuit.elementsOnBar) {
    paintBarButton(context, item);
  }
  if (circuit.spawningElement) {
    paintBarButton(context, circuit.spawningElement);
  }
}
