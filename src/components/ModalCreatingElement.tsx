import type { Palette } from '../theme/palettes';
import './ModalCreatingElement.css';

interface ModalCreatingElementProps {
  palette: Palette;
  onNameChange: (name: string) => void;
}

export function ModalCreatingElement({ palette, onNameChange }: ModalCreatingElementProps) {
  return (
    <div className="modal">
      <input
        type="text"
        className="textBox"
        placeholder="Element name"
        style={{
          borderBottom: `5px solid ${palette.elementsColor}`,
          backgroundColor: palette.backgroundColor,
          color: 'white',
        }}
        onChange={(event) => onNameChange(event.target.value)}
      />
    </div>
  );
}
