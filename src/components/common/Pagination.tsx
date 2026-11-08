import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
import { focusRingClass } from './tokens';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageNumbers?: boolean;
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageNumbers = true,
  className = '',
  itemLabel = 'records',
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(safeTotalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < safeTotalPages - 2) {
        pages.push('...');
      }
      pages.push(safeTotalPages);
    }
    return pages;
  };

  return (
    <div
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A] text-xs text-[#5D6B7B] dark:text-[#A9BACB] ${className}`}
    >
      {/* Items Range & Page Size */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <span className="font-sans">
            Showing <strong className="font-semibold text-[#273444] dark:text-[#E8EEF5] font-mono tabular-nums">{startItem}</strong>–
            <strong className="font-semibold text-[#273444] dark:text-[#E8EEF5] font-mono tabular-nums">{endItem}</strong> of{' '}
            <strong className="font-semibold text-[#273444] dark:text-[#E8EEF5] font-mono tabular-nums">{totalItems}</strong> {itemLabel}
          </span>
        )}

        {onPageSizeChange && pageSizeOptions && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Select records per page"
              className={`h-6 px-1.5 py-0 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xs text-[11px] text-[#273444] dark:text-[#E8EEF5] cursor-pointer hover:border-[#168C83] ${focusRingClass}`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          icon={<ChevronsLeft className="w-3.5 h-3.5" />}
          aria-label="First page"
          title="First page"
        />

        {/* Previous Button */}
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<ChevronLeft className="w-3.5 h-3.5" />}
          aria-label="Previous page"
        >
          Prev
        </Button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <div className="hidden sm:flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-[#8793A1] dark:text-[#8194A8] font-mono">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={`min-w-6 h-6 px-1.5 rounded-xs font-mono text-[11px] font-medium transition-colors cursor-pointer ${
                    p === currentPage
                      ? 'bg-[#168C83] text-white font-semibold'
                      : 'text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D] border border-transparent hover:border-[#DCE3EA] dark:hover:border-[#33485D]'
                  } ${focusRingClass}`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        )}

        {/* Mobile Page Indicator */}
        <span className="sm:hidden px-2 py-0.5 font-mono text-[11px] text-[#273444] dark:text-[#E8EEF5] font-medium">
          {currentPage} / {safeTotalPages}
        </span>

        {/* Next Button */}
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          icon={<ChevronRight className="w-3.5 h-3.5" />}
          iconPosition="right"
          aria-label="Next page"
        >
          Next
        </Button>

        {/* Last Page Button */}
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(safeTotalPages)}
          icon={<ChevronsRight className="w-3.5 h-3.5" />}
          aria-label="Last page"
          title="Last page"
        />
      </div>
    </div>
  );
};

