import type { Palette } from '../theme/palettes';
import { withAlpha } from '../theme/tint';
import './ModalCreatingElement.css';

interface ModalCreatingElementProps {
  palette: Palette;
  onNameChange: (name: string) => void;
}

export function ModalCreatingElement({ palette, onNameChange }: ModalCreatingElementProps) {
  return (
    <div className="modal">
      <div
        className="modal-card"
        style={{
          backgroundColor: withAlpha(palette.backgroundColor, 0.46),
          borderColor: withAlpha(palette.elementsSelectedColor, 0.95),
          boxShadow: `0 30px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 1px ${withAlpha(palette.elementsColor, 0.35)}`,
        }}
      >
        <p className="modal-kicker">Custom element</p>
        <input
          type="text"
          className="textBox"
          placeholder="Element name"
          style={{
            borderBottom: `2px solid ${palette.elementsColor}`,
            backgroundColor: 'transparent',
            color: 'white',
            caretColor: palette.signalColor,
          }}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
    </div>
  );
}
