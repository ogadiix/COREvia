import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
} from 'lucide-react';
import { focusRingClass } from './tokens';
import { Checkbox } from './Checkbox';
import { Pagination } from './Pagination';

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
      className={`border border-[#DCE3EA] dark:border-[#33485D] rounded-sm bg-white dark:bg-[#162638] shadow-xs flex flex-col ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse" aria-label={ariaLabel}>
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] font-semibold uppercase tracking-wider text-[11px] select-none">
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
                      isSortable && onSort
                        ? 'cursor-pointer hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D] transition-colors'
                        : ''
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
                        <span className="shrink-0 text-[#8793A1] dark:text-[#8194A8]">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#168C83] dark:text-[#2dd4c7]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#168C83] dark:text-[#2dd4c7]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-[#DCE3EA] dark:text-[#33485D] hover:text-[#5D6B7B] dark:hover:text-[#A9BACB]" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EEF4] dark:divide-[#26394C] text-[#273444] dark:text-[#E8EEF5]">
            {isLoading ? (
              Array.from({ length: loadingRowCount }).map((_, rIdx) => (
                <tr key={`loading-row-${rIdx}`} className="animate-pulse">
                  {selectable && (
                    <td className={`${rowPadding} w-10 text-center`}>
                      <div className="w-4 h-4 bg-[#EDF1F5] dark:bg-[#192B3D] rounded-xs mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`loading-col-${cIdx}`} className={rowPadding}>
                      <div
                        className={`h-3.5 bg-[#EDF1F5] dark:bg-[#192B3D] rounded-xs ${
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
                  className="py-12 text-center text-[#5D6B7B] dark:text-[#A9BACB]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EDF1F5] dark:bg-[#101C2A] flex items-center justify-center text-[#8793A1] dark:text-[#8194A8]">
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
                        ? 'bg-[#F0FDFB] dark:bg-[#192B3D] border-l-2 border-l-[#168C83]'
                        : index % 2 === 1
                        ? 'bg-[#F8FAFC]/60 dark:bg-[#192B3D]/30'
                        : 'bg-white dark:bg-[#162638]'
                    } ${
                      isClickable
                        ? `cursor-pointer hover:bg-[#EDF1F5] dark:hover:bg-[#20364B] ${focusRingClass}`
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          itemLabel="records"
        />
      )}
    </div>
  );
}

// Backward-compatible alias
export const Table = DataTable;
