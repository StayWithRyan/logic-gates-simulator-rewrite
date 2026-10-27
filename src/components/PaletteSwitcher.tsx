import { PALETTES, type Palette } from '../theme/palettes';
import { withAlpha } from '../theme/tint';
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
        backgroundColor: withAlpha(palette.componentsBackgroundColor, 0.58),
        borderColor: withAlpha(palette.fieldBorderColor, 0.9),
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
              backgroundColor: selected
                ? withAlpha(palette.elementsColor, 0.88)
                : withAlpha(palette.fieldColor, 0.42),
              borderColor: selected ? palette.elementsSelectedColor : 'rgba(255, 255, 255, 0.24)',
              boxShadow: selected
                ? `inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 8px 18px ${withAlpha(palette.elementsColor, 0.35)}`
                : 'inset 0 1px 0 rgba(255, 255, 255, 0.28)',
            }}
          >
            <span
              className="palette-swatch"
              aria-hidden="true"
              style={{
                backgroundColor: option.signalColor,
                boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, 0.5), 0 0 8px ${option.signalColor}`,
              }}
            />
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
