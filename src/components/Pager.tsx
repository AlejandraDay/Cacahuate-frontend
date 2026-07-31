import React from 'react';

interface PagerProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

const getPageWindow = (page: number, totalPages: number, windowSize = 4): number[] => {
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
};

const Pager: React.FC<PagerProps> = ({
  page,
  totalPages,
  totalCount,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const safeTotalPages = Math.max(totalPages, 1);
  if (safeTotalPages <= 1 && !(pageSize && onPageSizeChange)) return null;

  const pages = getPageWindow(page, safeTotalPages);
  const showLeadingGap = pages[0] > 2;
  const showTrailingGap = pages[pages.length - 1] < safeTotalPages - 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t border-gray-100">
      <div className="flex items-center gap-1 flex-wrap">
        {safeTotalPages > 1 && (
          <>
            {pages[0] > 1 && (
              <button
                onClick={() => onPageChange(1)}
                className="min-w-[1.75rem] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                1
              </button>
            )}
            {showLeadingGap && <span className="px-1 text-xs text-gray-300">…</span>}
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[1.75rem] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            {showTrailingGap && <span className="px-1 text-xs text-gray-300">…</span>}
            {pages[pages.length - 1] < safeTotalPages && (
              <button
                onClick={() => onPageChange(safeTotalPages)}
                className="min-w-[1.75rem] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {safeTotalPages}
              </button>
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= safeTotalPages}
              className="ml-1 px-3 h-7 flex items-center rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors"
            >
              Siguiente
            </button>
            <button
              onClick={() => onPageChange(safeTotalPages)}
              disabled={page >= safeTotalPages}
              className="px-3 h-7 flex items-center rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors"
            >
              Última
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400 whitespace-nowrap">{totalCount} en total</p>
        {pageSize != null && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-400 whitespace-nowrap">Mostrar:</label>
            <div className="flex items-center gap-1">
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                  className={`min-w-[2rem] h-7 px-1.5 flex items-center justify-center rounded-lg text-xs font-semibold border transition-colors ${
                    size === pageSize
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pager;
