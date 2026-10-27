import { BUTTON_SIZE, type Layout } from '../layout';
import type { Circuit, ElementKind, LogicElement, SpawnPreview } from '../simulation/types';
import { colorsForKind, CLASSIC_PALETTE, type Palette } from '../theme/palettes';
import { withAlpha } from '../theme/tint';

const LEAD = 16;
const BODY_INSET_Y = 7;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function textWidth(context: CanvasRenderingContext2D, text: string, fallbackPerChar: number): number {
  const metrics = context.measureText(text);
  if (metrics && typeof metrics.width === 'number') {
    return metrics.width;
  }
  return text.length * fallbackPerChar;
}

function traceRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function paintGlassOverlay(context: CanvasRenderingContext2D, box: Box): void {
  if (typeof context.createLinearGradient !== 'function') {
    return;
  }
  const gradient = context.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
  if (!gradient || typeof gradient.addColorStop !== 'function') {
    return;
  }
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
  gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.52, 'rgba(255, 255, 255, 0.02)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.24)');
  context.fillStyle = gradient;
  context.fillRect(box.x, box.y, box.w, box.h);
}

function fillGlass(
  context: CanvasRenderingContext2D,
  trace: () => void,
  box: Box,
  color: string,
  selectedColor?: string,
): void {
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.42)';
  context.shadowBlur = 16;
  context.shadowOffsetY = 7;
  trace();
  context.fillStyle = color;
  context.fill();
  context.restore();

  context.save();
  trace();
  context.clip();
  paintGlassOverlay(context, box);
  context.restore();

  if (selectedColor) {
    context.save();
    context.shadowColor = selectedColor;
    context.shadowBlur = 18;
    context.globalAlpha = 0.9;
    trace();
    context.lineWidth = 9;
    context.strokeStyle = selectedColor;
    context.stroke();
    context.restore();
  }

  trace();
  context.lineWidth = 1.5;
  context.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  context.stroke();

  if (selectedColor) {
    trace();
    context.lineWidth = 3.5;
    context.strokeStyle = selectedColor;
    context.stroke();
    trace();
    context.lineWidth = 1.25;
    context.strokeStyle = '#ffffff';
    context.stroke();
  }
}

function paintBloom(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
): void {
  if (typeof context.createRadialGradient !== 'function') {
    return;
  }
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  if (!gradient || typeof gradient.addColorStop !== 'function') {
    return;
  }
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, withAlpha(color, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function paintAtmosphere(context: CanvasRenderingContext2D, layout: Layout, palette: Palette): void {
  const width = layout.viewportWidth;
  const height = layout.viewportHeight;
  context.fillStyle = palette.backgroundColor;
  context.fillRect(0, 0, width, height);

  paintBloom(context, width * 0.12, height * 0.18, Math.max(width, height) * 0.42, palette.elementsColor, 0.28);
  paintBloom(context, width * 0.86, height * 0.78, Math.max(width, height) * 0.36, palette.signalColor, 0.16);
  paintBloom(context, width * 0.55, 0, Math.max(width, height) * 0.28, palette.andElementsColor, 0.12);

  context.save();
  context.globalAlpha = 0.05;
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.moveTo(0, height * 0.12);
  context.lineTo(width, height * 0.02);
  context.lineTo(width, height * 0.2);
  context.lineTo(0, height * 0.36);
  context.closePath();
  context.fill();
  context.restore();

  if (typeof context.createRadialGradient !== 'function') {
    return;
  }
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.28,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  );
  if (!vignette || typeof vignette.addColorStop !== 'function') {
    return;
  }
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function paintGrid(context: CanvasRenderingContext2D, box: Box): void {
  context.save();
  context.fillStyle = 'rgba(255, 255, 255, 0.055)';
  context.beginPath();
  for (let x = box.x + 28; x < box.x + box.w - 16; x += 40) {
    for (let y = box.y + 28; y < box.y + box.h - 16; y += 40) {
      context.moveTo(x + 1.15, y);
      context.arc(x, y, 1.15, 0, Math.PI * 2);
    }
  }
  context.fill();
  context.restore();
}

function paintMarks(context: CanvasRenderingContext2D, box: Box): void {
  context.save();
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  context.lineWidth = 1.5;
  const size = 16;
  const margin = 16;
  const corners: Array<[number, number, number, number]> = [
    [box.x + margin, box.y + margin, 1, 1],
    [box.x + box.w - margin, box.y + margin, -1, 1],
    [box.x + margin, box.y + box.h - margin, 1, -1],
    [box.x + box.w - margin, box.y + box.h - margin, -1, -1],
  ];
  for (const [x, y, dx, dy] of corners) {
    context.beginPath();
    context.moveTo(x, y + dy * size);
    context.lineTo(x, y);
    context.lineTo(x + dx * size, y);
    context.stroke();
  }
  context.restore();
}

function paintField(context: CanvasRenderingContext2D, layout: Layout, palette: Palette): void {
  const box: Box = {
    x: layout.fieldBeginX,
    y: layout.fieldBeginY,
    w: layout.fieldWidth,
    h: layout.fieldHeight,
  };
  const radius = 28;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.48)';
  context.shadowBlur = 30;
  context.shadowOffsetY = 16;
  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.fillStyle = palette.fieldColor;
  context.fill();
  context.restore();

  context.save();
  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.clip();
  paintGlassOverlay(context, box);
  paintGrid(context, box);
  context.restore();

  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.lineWidth = 2;
  context.strokeStyle = palette.fieldBorderColor;
  context.stroke();

  traceRoundRect(context, box.x + 6, box.y + 6, box.w - 12, box.h - 12, radius - 5);
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  context.stroke();

  paintMarks(context, box);
}

function dockBox(circuit: Circuit, layout: Layout): Box {
  const items = circuit.elementsOnBar;
  const y = layout.fieldEndY + 22;
  const height = 56;
  if (items.length === 0) {
    return { x: layout.fieldBeginX - 16, y, w: 240, h: height };
  }
  const left = Math.min(...items.map((item) => item.x));
  const right = Math.max(...items.map((item) => item.x + item.width));
  return { x: left - 18, y, w: right - left + 36, h: height };
}

function paintDock(context: CanvasRenderingContext2D, circuit: Circuit, layout: Layout, palette: Palette): void {
  const box = dockBox(circuit, layout);
  const radius = 22;
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.4)';
  context.shadowBlur = 22;
  context.shadowOffsetY = 10;
  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.fillStyle = palette.componentsBackgroundColor;
  context.fill();
  context.restore();

  context.save();
  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.clip();
  paintGlassOverlay(context, box);
  context.restore();

  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.lineWidth = 1.25;
  context.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  context.stroke();
}

function paintGlyph(context: CanvasRenderingContext2D, x: number, y: number, kind: 'plus' | 'minus'): void {
  const centerX = x + BUTTON_SIZE / 2;
  const centerY = y + BUTTON_SIZE / 2;
  context.beginPath();
  context.moveTo(centerX - 7, centerY);
  context.lineTo(centerX + 7, centerY);
  if (kind === 'plus') {
    context.moveTo(centerX, centerY - 7);
    context.lineTo(centerX, centerY + 7);
  }
  context.lineWidth = 2.4;
  context.strokeStyle = '#ffffff';
  context.stroke();
}

function paintKey(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'plus' | 'minus',
  palette: Palette,
): void {
  const box: Box = { x, y, w: BUTTON_SIZE, h: BUTTON_SIZE };
  fillGlass(context, () => traceRoundRect(context, x, y, BUTTON_SIZE, BUTTON_SIZE, 11), box, palette.elementsColor);

  context.save();
  context.globalAlpha = 0.55;
  traceRoundRect(context, x + 4, y + 4, BUTTON_SIZE - 8, BUTTON_SIZE - 8, 8);
  context.fillStyle = palette.elementsSelectedColor;
  context.fill();
  context.restore();

  paintGlyph(context, x, y, kind);
}

function paintKeys(context: CanvasRenderingContext2D, layout: Layout, palette: Palette): void {
  paintKey(context, layout.plusInputX, layout.plusInputY, 'plus', palette);
  paintKey(context, layout.minusInputX, layout.minusInputY, 'minus', palette);
  paintKey(context, layout.plusOutputX, layout.plusOutputY, 'plus', palette);
  paintKey(context, layout.minusOutputX, layout.minusOutputY, 'minus', palette);
}

function paintWire(
  context: CanvasRenderingContext2D,
  source: { x: number; y: number; signaled: boolean; selectedNext: unknown },
  next: { x: number; y: number },
  palette: Palette,
): void {
  const color = source.signaled ? palette.signalColor : palette.noSignalColor;
  const strokeSegment = (lineWidth: number, strokeStyle: string) => {
    context.beginPath();
    context.moveTo(source.x, source.y);
    context.lineTo(next.x, next.y);
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;
    context.stroke();
  };

  context.save();
  context.lineCap = 'round';
  if (source.selectedNext === next) {
    context.globalAlpha = 0.55;
    strokeSegment(12, palette.orElementsSelectedColor);
    context.globalAlpha = 1;
    strokeSegment(7, palette.orElementsSelectedColor);
  }
  if (source.signaled) {
    context.globalAlpha = 0.38;
    strokeSegment(11, palette.signalColor);
    context.globalAlpha = 1;
  }
  strokeSegment(source.signaled ? 6.5 : 5, 'rgba(255, 255, 255, 0.16)');
  strokeSegment(source.signaled ? 3.25 : 2.4, color);
  context.globalAlpha = source.signaled ? 0.7 : 0.28;
  strokeSegment(1.1, '#ffffff');
  context.restore();
}

function paintDragLine(
  context: CanvasRenderingContext2D,
  line: [number, number, number, number],
  palette: Palette,
): void {
  context.save();
  context.setLineDash([6, 8]);
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(line[0], line[1]);
  context.lineTo(line[2], line[3]);
  context.lineWidth = 7;
  context.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  context.stroke();
  context.beginPath();
  context.moveTo(line[0], line[1]);
  context.lineTo(line[2], line[3]);
  context.lineWidth = 2.5;
  context.strokeStyle = palette.noSignalColor;
  context.stroke();
  context.restore();
}

function paintPortSpine(
  context: CanvasRenderingContext2D,
  fieldX: number,
  ys: number[],
  side: 'left' | 'right',
): void {
  if (ys.length < 2) {
    return;
  }
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const x = side === 'left' ? fieldX - 30 : fieldX + 12;
  const y = top - 18;
  const height = bottom - top + 36;
  traceRoundRect(context, x, y, 18, height, 9);
  context.fillStyle = 'rgba(255, 255, 255, 0.06)';
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  context.stroke();
}

function paintHousing(context: CanvasRenderingContext2D, fieldX: number, nodeX: number, y: number): void {
  const left = Math.min(fieldX, nodeX) - 2;
  const right = Math.max(fieldX, nodeX) + 2;
  const height = 44;
  const top = y - height / 2;
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.28)';
  context.shadowBlur = 10;
  context.shadowOffsetY = 4;
  traceRoundRect(context, left, top, right - left, height, height / 2);
  context.fillStyle = 'rgba(255, 255, 255, 0.07)';
  context.fill();
  context.restore();
  traceRoundRect(context, left, top, right - left, height, height / 2);
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  context.stroke();
}

function paintLamp(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  signaled: boolean,
  palette: Palette,
): void {
  const color = signaled ? palette.signalColor : palette.noSignalColor;
  context.save();
  if (signaled) {
    context.shadowColor = color;
    context.shadowBlur = 22;
  }
  context.beginPath();
  context.arc(x, y, 20, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.restore();

  context.beginPath();
  context.arc(x, y, 20, 0, Math.PI * 2);
  context.lineWidth = 3;
  context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  context.stroke();

  if (typeof context.createRadialGradient !== 'function') {
    return;
  }
  const gloss = context.createRadialGradient(x - 6, y - 7, 1, x, y, 20);
  if (!gloss || typeof gloss.addColorStop !== 'function') {
    return;
  }
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
  gloss.addColorStop(0.42, 'rgba(255, 255, 255, 0.06)');
  gloss.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  context.beginPath();
  context.arc(x, y, 20, 0, Math.PI * 2);
  context.fillStyle = gloss;
  context.fill();
}

function paintJewel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  signaled: boolean,
  palette: Palette,
): void {
  context.beginPath();
  context.arc(x, y, 12.5, 0, Math.PI * 2);
  context.fillStyle = 'rgba(8, 10, 16, 0.78)';
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = 'rgba(255, 255, 255, 0.58)';
  context.stroke();

  context.beginPath();
  context.arc(x, y, 6.2, 0, Math.PI * 2);
  context.fillStyle = signaled ? palette.signalColor : palette.noSignalColor;
  context.fill();

  context.beginPath();
  context.fillStyle = 'rgba(255, 255, 255, 0.78)';
  context.ellipse(x - 3.1, y - 3.5, 2.3, 1.35, -0.7, 0, Math.PI * 2);
  context.fill();
}

function paintFieldBody(
  context: CanvasRenderingContext2D,
  fieldX: number,
  nodeX: number,
  y: number,
  signaled: boolean,
  palette: Palette,
): void {
  paintHousing(context, fieldX, nodeX, y);
  paintLamp(context, fieldX, y, signaled, palette);
  paintJewel(context, nodeX, y, signaled, palette);
}

function traceAnd(context: CanvasRenderingContext2D, box: Box): void {
  const radius = Math.min(box.h / 2, box.w * 0.48);
  const straight = box.x + box.w - radius;
  const mid = box.y + box.h / 2;
  context.beginPath();
  context.moveTo(box.x, box.y);
  context.lineTo(straight, box.y);
  context.arc(straight, mid, radius, -Math.PI / 2, Math.PI / 2, false);
  context.lineTo(box.x, box.y + box.h);
  context.closePath();
}

function traceOr(context: CanvasRenderingContext2D, box: Box): void {
  const right = box.x + box.w;
  const bottom = box.y + box.h;
  const mid = box.y + box.h / 2;
  context.beginPath();
  context.moveTo(box.x, box.y);
  context.quadraticCurveTo(box.x + box.w * 0.68, box.y + box.h * 0.04, right, mid);
  context.quadraticCurveTo(box.x + box.w * 0.68, box.y + box.h * 0.96, box.x, bottom);
  context.quadraticCurveTo(box.x + box.w * 0.24, mid, box.x, box.y);
  context.closePath();
}

function traceNot(context: CanvasRenderingContext2D, box: Box): void {
  const mid = box.y + box.h / 2;
  context.beginPath();
  context.moveTo(box.x, box.y);
  context.lineTo(box.x + box.w, mid);
  context.lineTo(box.x, box.y + box.h);
  context.closePath();
}

function traceChip(context: CanvasRenderingContext2D, box: Box): void {
  const notchW = Math.min(26, box.w * 0.24);
  const notchH = Math.min(7, box.h * 0.16);
  const radius = Math.min(14, box.h / 4, box.w / 6);
  const notchX = box.x + (box.w - notchW) / 2;
  context.beginPath();
  context.moveTo(box.x + radius, box.y);
  context.lineTo(notchX, box.y);
  context.lineTo(notchX, box.y + notchH);
  context.lineTo(notchX + notchW, box.y + notchH);
  context.lineTo(notchX + notchW, box.y);
  context.lineTo(box.x + box.w - radius, box.y);
  context.arcTo(box.x + box.w, box.y, box.x + box.w, box.y + box.h, radius);
  context.arcTo(box.x + box.w, box.y + box.h, box.x, box.y + box.h, radius);
  context.arcTo(box.x, box.y + box.h, box.x, box.y, radius);
  context.arcTo(box.x, box.y, box.x + box.w, box.y, radius);
  context.closePath();
}

function traceTicket(context: CanvasRenderingContext2D, box: Box): void {
  const cut = Math.min(16, box.w * 0.14, box.h * 0.34);
  const radius = Math.min(12, box.h / 4, box.w / 6);
  context.beginPath();
  context.moveTo(box.x + radius, box.y);
  context.lineTo(box.x + box.w - cut, box.y);
  context.lineTo(box.x + box.w, box.y + cut);
  context.lineTo(box.x + box.w, box.y + box.h - radius);
  context.arcTo(box.x + box.w, box.y + box.h, box.x, box.y + box.h, radius);
  context.arcTo(box.x, box.y + box.h, box.x, box.y, radius);
  context.arcTo(box.x, box.y, box.x + box.w, box.y, radius);
  context.closePath();
}

function traceCreate(context: CanvasRenderingContext2D, box: Box): void {
  const radius = Math.min(box.w, box.h) / 2;
  context.beginPath();
  context.arc(box.x + box.w / 2, box.y + box.h / 2, radius, 0, Math.PI * 2);
}

function traceKind(context: CanvasRenderingContext2D, kind: ElementKind | 'CREATE', box: Box): void {
  switch (kind) {
    case 'AND':
      traceAnd(context, box);
      return;
    case 'OR':
    case 'XOR':
      traceOr(context, box);
      return;
    case 'NOT':
      traceNot(context, box);
      return;
    case 'BIT':
      traceChip(context, box);
      return;
    case 'ADD2':
      traceAdder(context, box);
      return;
    case 'CREATE':
      traceCreate(context, box);
      return;
    case 'CUSTOM':
      traceTicket(context, box);
      return;
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function traceAdder(context: CanvasRenderingContext2D, box: Box): void {
  traceRoundRect(context, box.x, box.y, box.w, box.h, Math.min(22, box.h / 3, box.w / 4));
}

function kindFromName(name: string): ElementKind | 'CREATE' {
  switch (name) {
    case 'AND':
    case 'OR':
    case 'NOT':
    case 'XOR':
    case 'BIT':
    case 'ADD2':
    case 'CREATE':
      return name;
    default:
      return 'CUSTOM';
  }
}

function paintXorMark(context: CanvasRenderingContext2D, box: Box): void {
  const mid = box.y + box.h / 2;
  context.beginPath();
  context.moveTo(box.x + box.w * 0.05, box.y + box.h * 0.12);
  context.quadraticCurveTo(box.x + box.w * 0.3, mid, box.x + box.w * 0.05, box.y + box.h * 0.88);
  context.lineWidth = 2.5;
  context.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  context.stroke();
}

function paintNotBubble(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, color: string): void {
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  context.stroke();
}

function paintMemoryWell(context: CanvasRenderingContext2D, box: Box, on: boolean, palette: Palette): void {
  const width = Math.min(34, box.w * 0.3);
  const height = Math.min(14, box.h * 0.22);
  const x = box.x + (box.w - width) / 2;
  const y = box.y + 9;
  traceRoundRect(context, x, y, width, height, 6);
  context.fillStyle = on ? palette.signalColor : palette.noSignalColor;
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.48)';
  context.stroke();
}

function paintAdderMark(context: CanvasRenderingContext2D, box: Box): void {
  const centerX = box.x + box.w / 2;
  const centerY = box.y + Math.min(36, box.h * 0.24);
  context.beginPath();
  context.arc(centerX, centerY, 12, 0, Math.PI * 2);
  context.lineWidth = 1.5;
  context.strokeStyle = 'rgba(255, 255, 255, 0.78)';
  context.stroke();
  context.beginPath();
  context.moveTo(centerX - 6, centerY);
  context.lineTo(centerX + 6, centerY);
  context.moveTo(centerX, centerY - 6);
  context.lineTo(centerX, centerY + 6);
  context.stroke();
}

function paintFold(context: CanvasRenderingContext2D, box: Box): void {
  const cut = Math.min(16, box.w * 0.14, box.h * 0.34);
  context.beginPath();
  context.moveTo(box.x + box.w - cut, box.y);
  context.lineTo(box.x + box.w, box.y + cut);
  context.lineTo(box.x + box.w - cut, box.y + cut);
  context.closePath();
  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.fill();
}

function paintCenteredName(
  context: CanvasRenderingContext2D,
  name: string,
  box: Box,
  fontSize: number,
  shiftX: number,
  shiftY: number,
): void {
  context.save();
  context.font = `600 ${fontSize}px "Roboto Mono", ui-monospace, monospace`;
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowBlur = 6;
  context.shadowOffsetY = 1;
  context.fillText(name, box.x + box.w / 2 + shiftX, box.y + box.h / 2 + shiftY);
  context.restore();
}

function paintPinLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
): void {
  if (!label) {
    return;
  }
  context.save();
  context.font = '600 11px "Roboto Mono", ui-monospace, monospace';
  const width = textWidth(context, label, 7);
  const padX = 5;
  const chipW = width + padX * 2;
  const chipH = 16;
  const chipX = align === 'right' ? x - chipW : x;
  traceRoundRect(context, chipX, y - chipH / 2, chipW, chipH, 8);
  context.fillStyle = 'rgba(0, 0, 0, 0.4)';
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = align === 'right' ? 'right' : 'left';
  context.textBaseline = 'middle';
  context.fillText(label, align === 'right' ? x - padX : x + padX, y);
  context.restore();
}

function paintLeads(context: CanvasRenderingContext2D, element: LogicElement, palette: Palette): void {
  const bodyLeft = element.x + LEAD;
  const bodyRight = element.x + element.width - LEAD;
  const strokeLead = (fromX: number, toX: number, y: number, signaled: boolean) => {
    context.beginPath();
    context.moveTo(fromX, y);
    context.lineTo(toX, y);
    context.lineWidth = 5;
    context.strokeStyle = signaled ? withAlpha(palette.signalColor, 0.4) : 'rgba(255, 255, 255, 0.1)';
    context.stroke();
    context.beginPath();
    context.moveTo(fromX, y);
    context.lineTo(toX, y);
    context.lineWidth = 2;
    context.strokeStyle = signaled ? palette.signalColor : 'rgba(255, 255, 255, 0.4)';
    context.stroke();
  };

  context.save();
  context.lineCap = 'round';
  for (const input of element.inputs) {
    strokeLead(input.x, bodyLeft, input.y, input.signaled);
  }
  for (const output of element.outputs) {
    strokeLead(bodyRight, output.x, output.y, output.signaled);
  }
  context.restore();
}

function paintCarrier(context: CanvasRenderingContext2D, element: LogicElement, selectedColor: string): void {
  const radius = Math.min(20, element.height / 2);
  traceRoundRect(context, element.x, element.y, element.width, element.height, radius);
  context.fillStyle = 'rgba(255, 255, 255, 0.045)';
  context.fill();
  context.lineWidth = element.selected ? 1.75 : 1;
  context.strokeStyle = element.selected ? selectedColor : 'rgba(255, 255, 255, 0.12)';
  context.stroke();
}

function labelPlacement(kind: ElementKind, height: number): { size: number; shiftX: number; shiftY: number } {
  if (kind === 'NOT') {
    return { size: 14, shiftX: -8, shiftY: 0 };
  }
  if (kind === 'AND') {
    return { size: 18, shiftX: -12, shiftY: 0 };
  }
  if (kind === 'OR' || kind === 'XOR') {
    return { size: 18, shiftX: -8, shiftY: 0 };
  }
  if (kind === 'BIT') {
    return { size: 18, shiftX: 0, shiftY: 8 };
  }
  if (kind === 'ADD2') {
    return { size: 22, shiftX: 0, shiftY: 18 };
  }
  return { size: height < 56 ? 15 : 18, shiftX: 0, shiftY: 0 };
}

function paintElement(context: CanvasRenderingContext2D, element: LogicElement, palette: Palette): void {
  const colors = colorsForKind(palette, element.kind);
  const body = {
    x: element.x + LEAD,
    y: element.y + BODY_INSET_Y,
    w: Math.max(8, element.width - LEAD * 2),
    h: Math.max(8, element.height - BODY_INSET_Y * 2),
  };
  const placement = labelPlacement(element.kind, element.height);

  const notTriangle =
    element.kind === 'NOT'
      ? {
          x: element.x,
          y: element.y + 1,
          w: Math.min(104, element.width * 0.58),
          h: Math.max(8, element.height - 2),
        }
      : null;

  if (element.kind !== 'NOT') {
    paintCarrier(context, element, colors.selected);
  }
  if (notTriangle) {
    const bubbleRadius = Math.max(6, Math.min(notTriangle.h * 0.2, 8));
    const bubbleX = notTriangle.x + notTriangle.w + bubbleRadius * 0.35;
    const bubbleY = notTriangle.y + notTriangle.h / 2;
    context.save();
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(bubbleX + bubbleRadius, bubbleY);
    context.lineTo(element.outputs[0]?.x ?? element.x + element.width, bubbleY);
    context.lineWidth = 4;
    context.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    context.stroke();
    context.restore();
    fillGlass(
      context,
      () => traceNot(context, notTriangle),
      notTriangle,
      colors.color,
      element.selected ? colors.selected : undefined,
    );
    paintNotBubble(context, bubbleX, bubbleY, bubbleRadius, colors.color);
  } else {
    paintLeads(context, element, palette);
    fillGlass(
      context,
      () => traceKind(context, element.kind, body),
      body,
      colors.color,
      element.selected ? colors.selected : undefined,
    );
  }

  if (element.kind === 'XOR') {
    paintXorMark(context, body);
  } else if (element.kind === 'BIT') {
    paintMemoryWell(context, body, element.storedBit, palette);
  } else if (element.kind === 'ADD2') {
    paintAdderMark(context, body);
  } else if (element.kind === 'CUSTOM') {
    paintFold(context, body);
  }

  for (const input of element.inputs) {
    paintJewel(context, input.x, input.y, input.signaled, palette);
  }
  for (const output of element.outputs) {
    paintJewel(context, output.x, output.y, output.signaled, palette);
  }

  const labelBox = notTriangle
    ? { x: notTriangle.x, y: element.y, w: notTriangle.w * 0.7, h: element.height }
    : { x: element.x, y: element.y, w: element.width, h: element.height };
  paintCenteredName(
    context,
    element.name,
    labelBox,
    placement.size,
    notTriangle ? 0 : placement.shiftX,
    placement.shiftY,
  );
  for (const input of element.inputs) {
    paintPinLabel(context, input.label, input.x + 20, input.y, 'left');
  }
  for (const output of element.outputs) {
    paintPinLabel(context, output.label, output.x - 20, output.y, 'right');
  }
}

function paintBarMark(context: CanvasRenderingContext2D, name: string, box: Box, accent: string): void {
  const mark: Box = {
    x: box.x + box.w - 32,
    y: box.y + 9,
    w: 22,
    h: box.h - 18,
  };
  if (mark.h < 8 || mark.w < 8) {
    return;
  }
  context.save();
  context.globalAlpha = 0.34;
  traceKind(context, kindFromName(name), mark);
  context.fillStyle = accent;
  context.fill();
  context.restore();
}

function paintBarButton(context: CanvasRenderingContext2D, element: SpawnPreview, palette: Palette): void {
  const box: Box = { x: element.x, y: element.y, w: element.width, h: element.height };
  const kind = kindFromName(element.name);
  const accent = kind === 'CREATE' ? palette.elementsColor : colorsForKind(palette, kind).color;
  const radius = Math.min(16, element.height / 2);

  fillGlass(context, () => traceRoundRect(context, box.x, box.y, box.w, box.h, radius), box, palette.fieldBorderColor);

  context.save();
  traceRoundRect(context, box.x, box.y, box.w, box.h, radius);
  context.clip();
  context.fillStyle = accent;
  context.fillRect(box.x, box.y, box.w, 4);
  paintBarMark(context, element.name, box, accent);
  context.restore();

  paintCenteredName(context, element.name, box, element.height < 56 ? 14 : 18, -8, 1);
}

/** Paints one frame. Hit targets stay on the layout geometry; only the picture changes. */
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

  context.save();
  context.lineJoin = 'round';
  context.lineCap = 'round';

  paintAtmosphere(context, layout, palette);
  paintField(context, layout, palette);
  paintDock(context, circuit, layout, palette);
  paintKeys(context, layout, palette);

  if (circuit.line) {
    paintDragLine(context, circuit.line, palette);
  }

  paintPortSpine(
    context,
    circuit.inputs[0]?.fieldX ?? layout.fieldBeginX,
    circuit.inputs.map((input) => input.y),
    'left',
  );
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
    paintElement(context, element, palette);
  }

  paintPortSpine(
    context,
    circuit.outputs[0]?.fieldX ?? layout.fieldEndX,
    circuit.outputs.map((output) => output.y),
    'right',
  );
  for (const output of circuit.outputs) {
    paintFieldBody(context, output.fieldX, output.x, output.y, output.signaled, palette);
  }

  for (const item of circuit.elementsOnBar) {
    paintBarButton(context, item, palette);
  }
  if (circuit.spawningElement) {
    paintBarButton(context, circuit.spawningElement, palette);
  }

  context.restore();
}
