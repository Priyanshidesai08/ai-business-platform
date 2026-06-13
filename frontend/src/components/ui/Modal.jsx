import { X } from 'lucide-react';

import { useEffect, useRef } from 'react';
import Button from './Button.jsx';

const Modal = ({ open, title, children, onClose }) => {
  const panelRef = useRef(null);
  const titleId = `modal-title-${title?.toLowerCase().replace(/\s+/g, '-') || 'dialog'}`;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--ui-overlay)] p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div ref={panelRef} tabIndex={-1} className="w-full max-w-3xl rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-2xl backdrop-blur-xl outline-none animate-float-in" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-[var(--ui-text)]">{title}</h2>
          </div>
          <Button variant="secondary" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
