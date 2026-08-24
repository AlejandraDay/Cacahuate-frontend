import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardDocumentListIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formsService } from '../services/forms';
import type { FormSubmissionResult } from '../types';
import Pager from './Pager';

const PAGE_SIZE = 6;

interface ReportsMenuProps {
  submissionIds: string[];
  onSelect: (submissionId: string) => void;
  disabled?: boolean;
  className?: string;
}

const buttonClass = 'inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50';

const ReportsMenu: React.FC<ReportsMenuProps> = ({ submissionIds, onSelect, disabled, className }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FormSubmissionResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) {
      setItems(null);
      setSearch('');
      setError('');
      setPage(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(submissionIds.map((id) => formsService.getSubmission(id)))
      .then((results) => { if (!cancelled) setItems(results); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar los informes'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filteredIndices = (items ?? [])
    .map((s, i) => ({ s, i }))
    .filter(({ s, i }) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const dateLabel = new Date(s.submittedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      return (
        dateLabel.toLowerCase().includes(q) ||
        `informe ${i + 1}`.includes(q) ||
        (s.therapistName ?? '').toLowerCase().includes(q)
      );
    });

  const totalPages = Math.max(1, Math.ceil(filteredIndices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredIndices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className={className}>
      <button onClick={() => setOpen(true)} disabled={disabled} className={buttonClass}>
        <ClipboardDocumentListIcon className="w-4 h-4" />
        Ver informes ({submissionIds.length})
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Informes de la cita ({submissionIds.length})</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="shrink-0 p-4 border-b border-gray-100">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por fecha o terapeuta..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-500" />
                  <p className="text-xs text-gray-400">Cargando informes...</p>
                </div>
              ) : error ? (
                <p className="text-sm text-red-600 text-center py-8 px-4">{error}</p>
              ) : filteredIndices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
              ) : (
                <div className="space-y-1">
                  {pageItems.map(({ s, i }) => (
                    <button
                      key={s.id}
                      onClick={() => { onSelect(s.id); setOpen(false); }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Informe {i + 1}</p>
                        <p className="text-xs text-gray-400 capitalize truncate">
                          {new Date(s.submittedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {s.therapistName ? ` · ${s.therapistName}` : ''}
                        </p>
                      </div>
                      <ClipboardDocumentListIcon className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!loading && !error && filteredIndices.length > 0 && (
              <div className="shrink-0">
                <Pager
                  page={safePage}
                  totalPages={totalPages}
                  totalCount={filteredIndices.length}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportsMenu;
