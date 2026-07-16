import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PaymentPage from './PaymentPage';

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
    global.fetch = vi.fn();
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
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));
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
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('ORD-123')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Custom error message' })
    });

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });
  
  it('shows error state when fetch throws', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument();
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
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
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
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
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
