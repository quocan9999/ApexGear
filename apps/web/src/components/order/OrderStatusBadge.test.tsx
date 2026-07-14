import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../i18n';
import OrderStatusBadge from './OrderStatusBadge';

describe('OrderStatusBadge', () => {
  it('renders a vi label for each status', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText(/chờ xử lý|chờ xác nhận/i)).toBeInTheDocument();
  });
  it('renders the cancelled label', () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText(/đã huỷ/i)).toBeInTheDocument();
  });
});
