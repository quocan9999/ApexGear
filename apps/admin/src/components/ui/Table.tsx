import type { Key, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export type TableRowKey<T> =
  | { [K in keyof T]: T[K] extends string | number | bigint ? K : never }[keyof T]
  | ((row: T) => Key);

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowKey: TableRowKey<T>;
  emptyState?: ReactNode;
  caption?: ReactNode;
  className?: string;
  rowClassName?: string | ((row: T) => string | undefined);
}

function isValidKey(value: unknown): value is Key {
  return (
    typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'bigint'
  );
}

function getRowKey<T>(row: T, rowKey: TableRowKey<T>): Key {
  if (typeof rowKey === 'function') {
    const value = rowKey(row);
    if (!isValidKey(value)) {
      throw new TypeError(
        `Table rowKey callback must return a primitive React.Key (string, number, or bigint); received ${typeof value}.`,
      );
    }
    return value;
  }
  const value = (row as Record<string, unknown>)[rowKey as string];
  if (!isValidKey(value)) {
    throw new TypeError(
      `Table rowKey property "${String(rowKey)}" must hold a primitive React.Key (string, number, or bigint); received ${typeof value}.`,
    );
  }
  return value;
}

export default function Table<T>({
  columns,
  data,
  rowKey,
  emptyState,
  caption,
  className,
  rowClassName,
}: TableProps<T>) {
  const { t } = useTranslation();

  const showFallbackRow = columns.length === 0 && data.length > 0;

  return (
    <div className={cn('admin-scrollbar overflow-x-auto rounded-lg border border-outline-variant', className)}>
      <table className="w-full border-collapse bg-surface-container-lowest text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-surface-container-low">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'label-md border-b border-outline-variant px-md py-3 text-on-surface-variant',
                  column.headerClassName,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 || showFallbackRow ? (
            <tr>
              <td colSpan={Math.max(columns.length, 1)} className="body-md px-md py-xl text-center text-on-surface-variant">
                {emptyState ?? t('common.empty')}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row, rowKey)}
                className={cn(
                  'border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low',
                  typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('body-sm px-md py-3 text-on-surface', column.cellClassName)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
