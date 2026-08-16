import { formatDuration } from '../lib/time';

interface Props {
  id: string;
  value: number;
  onChange: (next: number) => void;
  presets?: number[];
}

const DEFAULT_PRESETS = [30, 60, 120, 180];

export default function DurationField({ id, value, onChange, presets = DEFAULT_PRESETS }: Props) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const clamp = (next: number) => Math.max(0, Math.min(next, 24 * 60));

  return (
    <div className="duration-field">
      <div className="duration-inputs">
        <label className="duration-unit">
          <input
            id={id}
            className="control"
            type="number"
            min={0}
            max={24}
            step={1}
            value={hours}
            onChange={(event) => onChange(clamp(Number(event.target.value) * 60 + minutes))}
          />
          <span>h</span>
        </label>
        <label className="duration-unit">
          <input
            className="control"
            type="number"
            min={0}
            max={59}
            step={5}
            value={minutes}
            onChange={(event) => onChange(clamp(hours * 60 + Number(event.target.value)))}
          />
          <span>m</span>
        </label>
      </div>

      <div className="duration-presets">
        {presets.map((preset) => (
          <button
            key={preset}
            className="duration-chip"
            type="button"
            data-active={preset === value}
            aria-pressed={preset === value}
            onClick={() => onChange(preset)}
          >
            {formatDuration(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
