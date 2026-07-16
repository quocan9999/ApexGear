import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock EventSource
class MockEventSource {
  onmessage: any;
  onerror: any;
  close = vi.fn();
  constructor(_url: string) {
    (global as any).mockEventSourceInstance = this;
  }
}

global.EventSource = MockEventSource as any;

describe('PaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    delete (global as any).EventSource;
  });

  const renderWithRouter = (ui: React.ReactElement, { route = '/checkout/payment/123' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/checkout/payment/:orderId" element={ui} />
          <Route path="/checkout/success/:orderId" element={<div>Success Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    // Return a promise that doesn't resolve immediately to test loading state
    (api.get as any).mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<PaymentPage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders payment info when fetch is successful', async () => {
    const mockData = {
      success: true,
      data: {
        orderNumber: 'ORD-123',
        amount: 50000,
        bankAccount: '123456789',
        content: 'Thanh toan ORD-123',
        expiresAt: new Date(Date.now() + 600000).toISOString()
      }
    };
    (api.get as any).mockResolvedValueOnce({
      data: { data: mockData.data }
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('ORD-123')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    (api.get as any).mockRejectedValueOnce({
      response: { data: { message: 'Custom error message' } }
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });
  
  it('shows error state when fetch throws', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'));

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument();
    });
  });

  it('navigates to success page immediately if order is already paid', async () => {
    (api.get as any).mockRejectedValueOnce({
      response: { data: { message: 'Order is already paid' } }
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Success Page')).toBeInTheDocument();
    });
  });

  it('navigates to success page on SSE success message', async () => {
    const mockData = {
      success: true,
      data: {
        orderNumber: 'ORD-123',
        amount: 50000,
        bankAccount: '123456789',
        content: 'Thanh toan ORD-123',
        expiresAt: new Date(Date.now() + 600000).toISOString()
      }
    };
    (api.get as any).mockResolvedValueOnce({
      data: { data: mockData.data }
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('ORD-123')).toBeInTheDocument();
    });

    const eventSource = (global as any).mockEventSourceInstance;
    expect(eventSource).toBeDefined();

    // Trigger onmessage with success: true
    eventSource.onmessage({ data: JSON.stringify({ success: true }) });

    await waitFor(() => {
      expect(screen.getByText('Success Page')).toBeInTheDocument();
    });
  });

  it('shows expiration message when timer reaches 0', async () => {
    vi.useFakeTimers();
    const mockData = {
      success: true,
      data: {
        orderNumber: 'ORD-123',
        amount: 50000,
        bankAccount: '123456789',
        content: 'Thanh toan ORD-123',
        expiresAt: new Date(Date.now() + 600000).toISOString() // 10 mins from now
      }
    };
    (api.get as any).mockResolvedValueOnce({
      data: { data: mockData.data }
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('ORD-123')).toBeInTheDocument();
    });

    // Advance timers past 10 minutes
    vi.advanceTimersByTime(601000);

    await waitFor(() => {
      expect(screen.getByText('Đơn hàng đã hết hạn thanh toán')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
