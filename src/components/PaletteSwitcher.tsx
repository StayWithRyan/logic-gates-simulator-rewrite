import { PALETTES, type Palette } from '../theme/palettes';
import './PaletteSwitcher.css';

interface PaletteSwitcherProps {
  palette: Palette;
  onChange: (id: string) => void;
}

export function PaletteSwitcher({ palette, onChange }: PaletteSwitcherProps) {
  return (
    <div
      className="palette-switcher"
      role="group"
      aria-label="Color palette"
      style={{
        backgroundColor: palette.componentsBackgroundColor,
        borderColor: palette.fieldBorderColor,
      }}
    >
      {PALETTES.map((option) => {
        const selected = option.id === palette.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            style={{
              backgroundColor: selected ? palette.elementsColor : palette.fieldColor,
              borderColor: selected ? palette.elementsSelectedColor : palette.fieldBorderColor,
            }}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
