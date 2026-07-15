import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import {
  Badge,
  Button,
  Input,
  Pagination,
  Select,
  Spinner,
  Table,
  Textarea,
  type TableColumn,
} from './index';
import { buildPages } from './Pagination';

type RowKeyTypeFixture = {
  id: string;
  sequence: number;
  largeId: bigint;
  metadata: { source: string };
  tags: string[];
  enabled: boolean;
  nullableId: string | null;
  optionalId?: string;
  missingId: undefined;
};

const rowKeyTypeColumns: readonly TableColumn<RowKeyTypeFixture>[] = [];
const rowKeyTypeData: readonly RowKeyTypeFixture[] = [];

if (false) {
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="id" />;
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="sequence" />;
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="largeId" />;
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey={(row) => row.id} />;
  // @ts-expect-error Object-valued properties are not valid React keys.
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="metadata" />;
  // @ts-expect-error Array-valued properties are not valid React keys.
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="tags" />;
  // @ts-expect-error Boolean-valued properties are not valid React keys.
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="enabled" />;
  // @ts-expect-error Nullable properties can produce an invalid React key.
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="nullableId" />;
  // @ts-expect-error Optional properties can produce an undefined React key.
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="optionalId" />;
  // @ts-expect-error Undefined-valued properties are not valid React keys.
  void <Table<RowKeyTypeFixture> columns={rowKeyTypeColumns} data={rowKeyTypeData} rowKey="missingId" />;
}

describe('admin UI primitives', () => {
  it('renders a button and exposes its loading state accessibly', () => {
    const { rerender } = render(<Button>Action</Button>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeEnabled();

    rerender(<Button isLoading>Action</Button>);

    expect(screen.getByRole('button', { name: 'Action' })).toBeDisabled();
    expect(screen.getByRole('status', { name: i18n.t('common.loading') })).toBeInTheDocument();
  });

  it('associates an input with its label and error', () => {
    render(<Input id="email" label="Email" error="Required" />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
  });

  it('renders a localized fullscreen spinner', () => {
    render(<Spinner fullscreen />);

    const spinner = screen.getByRole('status', { name: i18n.t('common.loading') });
    expect(spinner.parentElement).toHaveClass('fixed', 'inset-0');
  });

  it('supports native select props and forwards its ref', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select ref={ref} label="Role" defaultValue="admin" required>
        <option value="admin">Admin</option>
      </Select>,
    );

    const select = screen.getByRole('combobox', { name: 'Role' });
    expect(select).toBeRequired();
    expect(select).toHaveValue('admin');
    expect(ref.current).toBe(select);
  });

  it('associates a textarea with its label and error', () => {
    render(<Textarea label="Notes" error="Required" rows={4} />);

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Required');
  });

  it('renders every badge variant with semantic token classes', () => {
    const expectedClasses = {
      default: ['bg-surface-container', 'text-on-surface-variant'],
      primary: ['bg-primary/10', 'text-primary'],
      success: ['bg-success/10', 'text-on-surface'],
      warning: ['bg-warning/10', 'text-on-surface'],
      error: ['bg-error-container', 'text-on-error-container'],
    } as const;

    for (const [variant, classNames] of Object.entries(expectedClasses)) {
      const { unmount } = render(
        <Badge variant={variant as keyof typeof expectedClasses}>{variant}</Badge>,
      );
      expect(screen.getByText(variant)).toHaveClass(...classNames);
      unmount();
    }
  });
});

describe('Table', () => {
  const columns = [
    { key: 'name', header: 'Name', render: (row: { id: string; name: string }) => row.name },
    { key: 'action', header: <span>Action</span>, render: () => <button type="button">Edit</button> },
  ];

  it('renders semantic headers and rows with stable property and callback row keys', () => {
    const { container, rerender } = render(
      <Table columns={columns} data={[{ id: '1', name: 'Keyboard' }]} rowKey="id" />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Keyboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);

    rerender(
      <Table columns={columns} data={[{ id: '1', name: 'Keyboard' }]} rowKey={(row) => row.id} />,
    );
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('renders the localized empty state', () => {
    render(<Table columns={columns} data={[]} rowKey="id" />);

    expect(screen.getByText(i18n.t('common.empty'))).toBeInTheDocument();
  });

  it('renders one meaningful state row instead of blank rows when columns are empty', () => {
    const { container } = render(
      <Table columns={[]} data={[{ id: '1' }, { id: '2' }]} rowKey="id" />,
    );

    expect(screen.getByRole('cell', { name: i18n.t('common.empty') })).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container.querySelectorAll('tbody td')).toHaveLength(1);
  });

  it('rejects a callback key that bypasses the public type with an invalid runtime value', () => {
    const invalidRowKey = (() => ({ id: 'not-a-react-key' })) as unknown as () => React.Key;

    expect(() => render(
      <Table columns={columns} data={[{ id: '1', name: 'Keyboard' }]} rowKey={invalidRowKey} />,
    )).toThrow(TypeError);
  });
});

describe('Pagination', () => {
  it('builds deterministic beginning, middle, and end windows without hidden gaps', () => {
    expect(buildPages(1, 9)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 9]);
    expect(buildPages(4, 9)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 9]);
    expect(buildPages(5, 9)).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 9]);
    expect(buildPages(6, 9)).toEqual([1, 'start-ellipsis', 5, 6, 7, 8, 9]);
    expect(buildPages(9, 9)).toEqual([1, 'start-ellipsis', 5, 6, 7, 8, 9]);
  });

  it('returns null when there is only one page or totalPages is non-finite', () => {
    for (const totalPages of [1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { container, unmount } = render(
        <Pagination page={1} totalPages={totalPages} onPageChange={vi.fn()} />,
      );
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('normalizes finite values and never emits a non-finite page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination page={Number.NaN} totalPages={9.8} onPageChange={onPageChange} />,
    );

    expect(screen.getByRole('button', { name: i18n.t('pagination.page', { page: 1 }) })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('pagination.next') }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    rerender(<Pagination page={4.9} totalPages={9.8} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: i18n.t('pagination.next') }));
    expect(onPageChange).toHaveBeenLastCalledWith(5);
    for (const [target] of onPageChange.mock.calls) {
      expect(Number.isFinite(target)).toBe(true);
      expect(Number.isInteger(target)).toBe(true);
      expect(target).toBeGreaterThanOrEqual(1);
      expect(target).toBeLessThanOrEqual(9);
    }
  });

  it('does not call onPageChange for current or disabled boundary controls', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination page={-10} totalPages={9} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole('button', { name: i18n.t('pagination.previous') }));
    await user.click(screen.getByRole('button', { name: i18n.t('pagination.page', { page: 1 }) }));
    expect(onPageChange).not.toHaveBeenCalled();

    rerender(<Pagination page={99} totalPages={9} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: i18n.t('pagination.next') }));
    await user.click(screen.getByRole('button', { name: i18n.t('pagination.page', { page: 9 }) }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('calls onPageChange for a valid page but not the current page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={9} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: i18n.t('pagination.page', { page: 3 }) }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: i18n.t('pagination.page', { page: 2 }) }));
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: i18n.t('pagination.page', { page: 2 }) })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
