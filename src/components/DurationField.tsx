import { useEffect, useState } from 'react';
import { formatDuration } from '../lib/time';

interface Props {
  id: string;
  value: number;
  onChange: (next: number) => void;
  presets?: number[];
}

const DEFAULT_PRESETS = [30, 60, 120, 180];

// One minute short of a full day: `validateManualEntry` rejects anything that
// reaches midnight, so the field must not be able to produce exactly 1440.
const MAX_MINUTES = 24 * 60 - 1;

function parseBox(text: string): number | null {
  if (text.trim() === '') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function DurationField({ id, value, onChange, presets = DEFAULT_PRESETS }: Props) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  // The boxes hold text so a half-typed or momentarily empty field does not
  // collapse the committed value to zero.
  const [hoursText, setHoursText] = useState(() => String(hours));
  const [minutesText, setMinutesText] = useState(() => String(minutes));

  useEffect(() => {
    setHoursText(String(Math.floor(value / 60)));
    setMinutesText(String(value % 60));
  }, [value]);

  const clamp = (next: number) => Math.max(0, Math.min(Math.round(next), MAX_MINUTES));

  const handleHours = (text: string) => {
    setHoursText(text);
    const parsed = parseBox(text);
    if (parsed === null) return;
    onChange(clamp(parsed * 60 + minutes));
  };

  const handleMinutes = (text: string) => {
    setMinutesText(text);
    const parsed = parseBox(text);
    if (parsed === null) return;
    onChange(clamp(hours * 60 + parsed));
  };

  return (
    <div className="duration-field">
      <div className="duration-inputs">
        <label className="duration-unit">
          <input
            id={id}
            className="control"
            type="number"
            min={0}
            max={23}
            step={1}
            value={hoursText}
            onChange={(event) => handleHours(event.target.value)}
            onBlur={() => setHoursText(String(Math.floor(value / 60)))}
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
            value={minutesText}
            onChange={(event) => handleMinutes(event.target.value)}
            onBlur={() => setMinutesText(String(value % 60))}
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
