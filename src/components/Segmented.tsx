import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

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

// ARIA radiogroup pattern with a roving tabindex: buttons carrying role="radio"
// get no native key handling, so arrow/Home/End navigation is implemented here.
export default function Segmented({ options, value, onChange, label }: Props) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = options.findIndex((option) => option.value === value);
  const tabbableIndex = activeIndex === -1 ? 0 : activeIndex;

  const selectIndex = (index: number) => {
    const option = options[index];
    onChange(option.value);
    buttonRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        selectIndex((index + 1) % options.length);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        selectIndex((index - 1 + options.length) % options.length);
        break;
      case 'Home':
        event.preventDefault();
        selectIndex(0);
        break;
      case 'End':
        event.preventDefault();
        selectIndex(options.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => {
            buttonRefs.current[index] = node;
          }}
          className="segmented-option"
          type="button"
          role="radio"
          aria-checked={option.value === value}
          data-active={option.value === value}
          tabIndex={index === tabbableIndex ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
