import React, { useEffect, useRef, useState } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <button onClick={() => setOpen((v) => !v)} disabled={disabled} className={buttonClass}>
        <ClipboardDocumentListIcon className="w-4 h-4" />
        Ver informes ({submissionIds.length})
        <ChevronDownIcon className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
          {submissionIds.map((id, i) => (
            <button
              key={id}
              onClick={() => { onSelect(id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Informe {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsMenu;
