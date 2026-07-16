import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PaymentPage from './PaymentPage';

// Mock EventSource
class MockEventSource {
  onmessage: any;
  onerror: any;
  close = vi.fn();
  constructor(_url: string) {}
}

global.EventSource = MockEventSource as any;

describe('PaymentPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, { route = '/checkout/payment/123' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/checkout/payment/:orderId" element={ui} />
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
      json: async () => ({ success: false, message: 'Custom error message' })
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
});
