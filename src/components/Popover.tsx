import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  anchor: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}

// Overlay anchored to a trigger element. Closes on Escape and on outside click,
// and flips above the trigger when there is not enough room below.
export default function Popover({ anchor, open, onClose, labelledBy, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const trigger = anchor.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const gap = 6;
      const margin = 8;

      let top = triggerRect.bottom + gap;
      if (top + panelRect.height > window.innerHeight - margin) {
        top = Math.max(margin, triggerRect.top - gap - panelRect.height);
      }

      let left = triggerRect.left;
      if (left + panelRect.width > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - panelRect.width);
      }

      setPosition({ top, left });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
      anchor.current?.focus();
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchor.current?.contains(target)) return;
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="popover"
      role="dialog"
      aria-labelledby={labelledBy}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>
  );
}
