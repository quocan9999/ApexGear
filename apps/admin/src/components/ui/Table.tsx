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

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowKey: keyof T | ((row: T) => Key);
  emptyState?: ReactNode;
  caption?: ReactNode;
  className?: string;
  rowClassName?: string | ((row: T) => string | undefined);
}

function getRowKey<T>(row: T, rowKey: TableProps<T>['rowKey']): Key {
  return typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as Key);
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
          {data.length === 0 ? (
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
