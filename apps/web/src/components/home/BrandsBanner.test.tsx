import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../i18n';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 'brand-1',
            name: 'Razer',
            slug: 'razer',
            logo: null,
            website: null,
          },
        ],
      },
    }),
  },
}));

import BrandsBanner from './BrandsBanner';

describe('BrandsBanner', () => {
  it('links brand tiles to the product list brand filter when no website exists', async () => {
    render(<BrandsBanner />);

    const links = await screen.findAllByRole('link', { name: 'Razer' });
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/products?brandId=brand-1');
    });
  });
});
