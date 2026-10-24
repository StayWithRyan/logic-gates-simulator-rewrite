import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { ModalCreatingElement } from './components/ModalCreatingElement';
import { createLayout, type Layout } from './layout';
import { drawScene } from './render/draw';
import { createInitialCircuit } from './simulation/circuit';
import {
  confirmCreatingElement,
  createPointerSession,
  pointerDown,
  pointerLeave,
  pointerMove,
  pointerUp,
  type PointerSession,
} from './simulation/interaction';
import { SIMULATION_INTERVAL_MS, stepSimulation } from './simulation/simulate';
import type { Circuit } from './simulation/types';
import { deleteSelection } from './simulation/wiring';

function mousePosition(canvas: HTMLCanvasElement, event: { clientX: number; clientY: number }): [number, number] {
  return [event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop];
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Layout | null>(null);
  const circuitRef = useRef<Circuit | null>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  if (!layoutRef.current) {
    layoutRef.current = createLayout(window.innerWidth, window.innerHeight);
  }
  if (!circuitRef.current) {
    circuitRef.current = createInitialCircuit(layoutRef.current);
  }
  if (!sessionRef.current) {
    sessionRef.current = createPointerSession();
  }
  const layout = layoutRef.current;
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const canvas = canvasRef.current;
      const circuit = circuitRef.current;
      const currentLayout = layoutRef.current;
      if (!canvas || !circuit || !currentLayout) {
        return;
      }
      drawScene(canvas, circuit, currentLayout);
      stepSimulation(circuit);
    }, SIMULATION_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const circuit = circuitRef.current;
      const currentLayout = layoutRef.current;
      const session = sessionRef.current;
      if (!circuit || !currentLayout || !session) {
        return;
      }
      if (event.code === 'Delete') {
        deleteSelection(circuit);
      }
      if (event.code === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
      if (event.code === 'Enter' && modalOpen) {
        setModalOpen(false);
        confirmCreatingElement(circuit, currentLayout, session);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  const withPointer = (
    event: ReactMouseEvent<HTMLCanvasElement>,
    handle: (circuit: Circuit, session: PointerSession, x: number, y: number) => void,
  ) => {
    const canvas = canvasRef.current;
    const circuit = circuitRef.current;
    const session = sessionRef.current;
    if (!canvas || !circuit || !session) {
      return;
    }
    const [x, y] = mousePosition(canvas, event);
    handle(circuit, session, x, y);
  };

  return (
    <>
      {modalOpen && (
        <ModalCreatingElement
          onNameChange={(name) => {
            const circuit = circuitRef.current;
            if (circuit) {
              circuit.creatingElementName = name;
            }
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        height={layout.viewportHeight}
        width={layout.viewportWidth}
        onMouseDown={(event) => {
          withPointer(event, (circuit, session, x, y) => {
            const action = pointerDown(circuit, layout, session, x, y);
            if (action === 'modal') {
              setModalOpen(true);
            }
          });
        }}
        onMouseUp={(event) => {
          withPointer(event, (circuit, session, x, y) => {
            pointerUp(circuit, layout, session, x, y);
          });
        }}
        onMouseMove={(event) => {
          withPointer(event, (circuit, session, x, y) => {
            pointerMove(circuit, layout, session, x, y);
          });
        }}
        onMouseLeave={() => {
          const circuit = circuitRef.current;
          const session = sessionRef.current;
          if (circuit && session) {
            pointerLeave(circuit, session);
          }
        }}
      />
    </>
  );
}
