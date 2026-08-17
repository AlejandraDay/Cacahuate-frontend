import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ReportsMenuProps {
  submissionIds: string[];
  onSelect: (submissionId: string) => void;
  disabled?: boolean;
  className?: string;
}

const buttonClass = 'inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50';

const ReportsMenu: React.FC<ReportsMenuProps> = ({ submissionIds, onSelect, disabled, className }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnScrollOrResize = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', closeOnScrollOrResize, true);
    window.addEventListener('resize', closeOnScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', closeOnScrollOrResize, true);
      window.removeEventListener('resize', closeOnScrollOrResize);
    };
  }, [open]);

  if (submissionIds.length === 0) return null;

  if (submissionIds.length === 1) {
    return (
      <button onClick={() => onSelect(submissionIds[0])} disabled={disabled} className={`${buttonClass} ${className ?? ''}`}>
        <ClipboardDocumentListIcon className="w-4 h-4" />
        Ver informe
      </button>
    );
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <button ref={buttonRef} onClick={() => setOpen((v) => !v)} disabled={disabled} className={buttonClass}>
        <ClipboardDocumentListIcon className="w-4 h-4" />
        Ver informes ({submissionIds.length})
        <ChevronDownIcon className="w-3.5 h-3.5" />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: position.top, left: position.left, minWidth: Math.max(position.width, 144) }}
          className="max-h-64 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50"
        >
          {submissionIds.map((id, i) => (
            <button
              key={id}
              onClick={() => { onSelect(id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Informe {i + 1}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportsMenu;
