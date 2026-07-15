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
} from './index';

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

  it('renders semantic badge variants without embedding domain text', () => {
    render(<Badge variant="success">Active</Badge>);

    expect(screen.getByText('Active')).toHaveClass('bg-success/10', 'text-success');
  });
});

describe('Table', () => {
  const columns = [
    { key: 'name', header: 'Name', render: (row: { id: string; name: string }) => row.name },
    { key: 'action', header: <span>Action</span>, render: () => <button type="button">Edit</button> },
  ];

  it('renders semantic headers and rows with stable row keys', () => {
    const { container } = render(
      <Table columns={columns} data={[{ id: '1', name: 'Keyboard' }]} rowKey="id" />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Keyboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('renders the localized empty state', () => {
    render(<Table columns={columns} data={[]} rowKey="id" />);

    expect(screen.getByText(i18n.t('common.empty'))).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('returns null when there is only one page', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
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
