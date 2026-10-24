import { COLORS } from '../layout';
import './ModalCreatingElement.css';

interface ModalCreatingElementProps {
  onNameChange: (name: string) => void;
}

export function ModalCreatingElement({ onNameChange }: ModalCreatingElementProps) {
  return (
    <div className="modal">
      <input
        type="text"
        className="textBox"
        placeholder="Element name"
        style={{
          borderBottom: `5px solid ${COLORS.elementsColor}`,
          backgroundColor: COLORS.backgroundColor,
          color: 'white',
        }}
        onChange={(event) => onNameChange(event.target.value)}
      />
    </div>
  );
}
