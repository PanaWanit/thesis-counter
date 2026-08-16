import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  anchor: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  label?: string;
  children: React.ReactNode;
}

// Overlay anchored to a trigger element. Closes on Escape, on outside click, and
// when focus moves to something outside both the panel and the trigger. Flips
// above the trigger when there is not enough room below.
//
// The panel is portalled into document.body on purpose: it is positioned with
// `position: fixed` from viewport coordinates, and any transformed ancestor
// (the tab view and the semester dialog both retain a transform from their
// entry animations) would otherwise become its containing block and shift it.
export default function Popover({ anchor, open, onClose, label, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Guards against onClose firing twice when two close paths race inside the
  // same task (an outside mousedown is immediately followed by a focusout).
  const closedRef = useRef(false);
  useEffect(() => {
    closedRef.current = false;
  }, [open]);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }, [onClose]);

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

    const isInside = (node: Node | null) => {
      if (!node) return false;
      if (panelRef.current?.contains(node)) return true;
      return Boolean(anchor.current?.contains(node));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
      anchor.current?.focus();
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (isInside(event.target as Node)) return;
      close();
    };

    // Tabbing away must dismiss the panel. A null relatedTarget means focus left
    // the window entirely (app switch), which must not close anything.
    const handleFocusOut = (event: FocusEvent) => {
      if (!isInside(event.target as Node)) return;
      const next = event.relatedTarget as Node | null;
      if (!next) return;
      if (isInside(next)) return;
      close();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [open, close, anchor]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="popover"
      data-popover-root=""
      role="dialog"
      aria-label={label}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>,
    document.body
  );
}
