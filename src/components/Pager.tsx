import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PagerProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

const Pager: React.FC<PagerProps> = ({
  page,
  totalPages,
  totalCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 20, 100],
}) => {
  if (totalPages <= 1 && !(pageSize && onPageSizeChange)) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Página {page} de {Math.max(totalPages, 1)} · {totalCount} en total
        </p>
        {pageSize != null && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-400">Por página:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {totalPages > 1 && (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors"
        >
          Siguiente
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      )}
    </div>
  );
};

export default Pager;
