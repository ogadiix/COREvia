import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { focusRingClass } from './tokens';
import { Checkbox } from './Checkbox';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  width?: string;
  mono?: boolean;
  sortable?: boolean;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  totalItems?: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  selectedKey?: string | number;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (selectedKeys: Set<string | number>) => void;
  pagination?: DataTablePagination;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingRowCount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  density?: 'compact' | 'normal';
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  pagination,
  emptyMessage = 'No records found in this register.',
  emptyIcon,
  isLoading = false,
  loadingRowCount = 5,
  sortBy,
  sortOrder = 'asc',
  onSort,
  density = 'normal',
  className = '',
  id,
  'aria-label': ariaLabel = 'Data Register',
}: DataTableProps<T>) {
  const rowPadding = density === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-3.5';

  // Selection calculations
  const allRowKeys = data.map((item) => keyExtractor(item));
  const isAllSelected =
    data.length > 0 &&
    Boolean(selectedKeys && allRowKeys.every((k) => selectedKeys.has(k)));
  const isSomeSelected =
    Boolean(selectedKeys && allRowKeys.some((k) => selectedKeys.has(k))) && !isAllSelected;

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedKeys ? Array.from(selectedKeys) : []);
    if (isAllSelected) {
      allRowKeys.forEach((k) => newSelected.delete(k));
    } else {
      allRowKeys.forEach((k) => newSelected.add(k));
    }
    onSelectionChange(newSelected);
  };

  const handleToggleRow = (key: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedKeys ? Array.from(selectedKeys) : []);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    onSelectionChange(newSelected);
  };

  // Pagination calculation
  const totalItems = pagination?.totalItems ?? data.length;
  const currentPage = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(startItem + (data.length ? data.length - 1 : 0), totalItems);

  return (
    <div
      id={id}
      className={`border border-[#CBD5E1] rounded-sm bg-white shadow-2xs flex flex-col ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse" aria-label={ariaLabel}>
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#CBD5E1] text-[#475569] font-semibold uppercase tracking-wider text-[11px] select-none">
              {selectable && (
                <th scope="col" className={`${rowPadding} w-10 text-center`}>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleToggleAll}
                    aria-label="Select all rows on current page"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                const isSortable = Boolean(col.sortable || onSort);

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    aria-sort={
                      isSorted
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : isSortable
                        ? 'none'
                        : undefined
                    }
                    onClick={isSortable && onSort ? () => onSort(col.key) : undefined}
                    className={`${rowPadding} ${
                      isSortable && onSort ? 'cursor-pointer hover:bg-[#F1F5F9] transition-colors' : ''
                    } ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.headerClassName || ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {isSortable && onSort && (
                        <span className="shrink-0 text-[#94A3B8]">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#087F8C]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#087F8C]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-[#CBD5E1] hover:text-[#64748B]" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#172033]">
            {isLoading ? (
              Array.from({ length: loadingRowCount }).map((_, rIdx) => (
                <tr key={`loading-row-${rIdx}`} className="animate-pulse">
                  {selectable && (
                    <td className={`${rowPadding} w-10 text-center`}>
                      <div className="w-4 h-4 bg-[#E2E8F0] rounded-xs mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`loading-col-${cIdx}`} className={rowPadding}>
                      <div
                        className={`h-3.5 bg-[#E2E8F0] rounded-xs ${
                          cIdx === 0 ? 'w-24' : cIdx === 1 ? 'w-36' : 'w-16'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-[#64748B]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
                      {emptyIcon || <AlertCircle className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const rowKey = keyExtractor(item);
                const strKey = String(rowKey);
                const isSelected =
                  (selectedKey !== undefined && String(selectedKey) === strKey) ||
                  Boolean(selectedKeys?.has(rowKey));
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={strKey}
                    tabIndex={isClickable ? 0 : undefined}
                    role={isClickable ? 'button' : undefined}
                    aria-selected={isSelected}
                    onClick={isClickable ? () => onRowClick(item) : undefined}
                    onKeyDown={
                      isClickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(item);
                            }
                          }
                        : undefined
                    }
                    className={`transition-colors duration-100 ${
                      isSelected
                        ? 'bg-[#f0fdfa] border-l-2 border-l-[#087F8C]'
                        : index % 2 === 1
                        ? 'bg-[#F8FAFC]/60'
                        : 'bg-white'
                    } ${
                      isClickable
                        ? `cursor-pointer hover:bg-[#F1F5F9] ${focusRingClass}`
                        : ''
                    }`}
                  >
                    {selectable && (
                      <td
                        className={`${rowPadding} w-10 text-center`}
                        onClick={(e) => handleToggleRow(rowKey, e)}
                      >
                        <Checkbox
                          checked={selectedKeys?.has(rowKey) || false}
                          onChange={() => {}}
                          aria-label={`Select row ${strKey}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${rowPadding} ${
                          col.mono ? 'font-mono tabular-nums' : ''
                        } ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(item, index) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="font-semibold text-[#172033]">{startItem}</strong>–
              <strong className="font-semibold text-[#172033]">{endItem}</strong> of{' '}
              <strong className="font-semibold text-[#172033]">{totalItems}</strong> records
            </span>
            {pagination.onPageSizeChange && pagination.pageSizeOptions && (
              <div className="flex items-center gap-1.5 ml-3">
                <span className="text-[11px] text-[#64748B]">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => pagination.onPageSizeChange!(Number(e.target.value))}
                  className="h-6 px-1.5 py-0 bg-white border border-[#CBD5E1] rounded-xs text-[11px] text-[#172033] focus:outline-none focus:border-[#087F8C]"
                >
                  {pagination.pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              disabled={currentPage <= 1}
              onClick={() => pagination.onPageChange(currentPage - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
              aria-label="Previous page"
            >
              Prev
            </Button>
            <span className="px-2 py-0.5 font-mono text-[11px] text-[#172033] font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={currentPage >= totalPages}
              onClick={() => pagination.onPageChange(currentPage + 1)}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
              iconPosition="right"
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward-compatible alias
export const Table = DataTable;
