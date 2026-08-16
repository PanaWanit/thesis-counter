interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (next: string) => void;
  label: string;
}

// Two-or-more-way switch rendered as a radio group so arrow keys work natively.
export default function Segmented({ options, value, onChange, label }: Props) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          className="segmented-option"
          type="button"
          role="radio"
          aria-checked={option.value === value}
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
