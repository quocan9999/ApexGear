import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from '../../types';

// Real i18n instance (vi) so t('common.outOfStock') resolves to the actual label.
import '../../i18n';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Bàn phím cơ AG Pro',
    slug: 'ban-phim-co-ag-pro',
    shortDescription: null,
    description: null,
    basePrice: 2000000,
    salePrice: null,
    isFeatured: false,
    isActive: true,
    categoryId: 'c1',
    brandId: 'b1',
    brand: { id: 'b1', name: 'ApexGear', slug: 'apexgear', description: null, logo: null, website: null },
    images: [
      { id: 'i1', url: 'https://res.cloudinary.com/demo/image/upload/kb.jpg', alt: 'kb', isPrimary: true, displayOrder: 0 },
    ],
    variants: [
      { id: 'v1', name: null, sku: 'SKU1', price: null, stockStatus: 'IN_STOCK', isDefault: true, attributes: null, displayOrder: 0 },
    ],
    averageRating: 0,
    createdAt: '2026-07-14T00:00:00.000Z',
    ...overrides,
  };
}

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );
}

describe('ProductCard', () => {
  it('links to the product detail page', () => {
    renderCard(makeProduct());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/ban-phim-co-ag-pro');
  });

  it('renders the product name and brand', () => {
    renderCard(makeProduct());
    expect(screen.getByText('Bàn phím cơ AG Pro')).toBeInTheDocument();
    expect(screen.getByText('ApexGear')).toBeInTheDocument();
  });

  it('uses the cloudinary medium transform for the primary image', () => {
    renderCard(makeProduct());
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('/upload/w_500,h_500,c_limit,q_auto,f_auto/');
  });

  it('shows the base price when there is no sale price', () => {
    renderCard(makeProduct());
    expect(screen.getByText(/2\.000\.000/)).toBeInTheDocument();
  });

  it('shows the sale price alongside a struck-through base price', () => {
    renderCard(makeProduct({ salePrice: 1500000 }));
    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument();
    expect(screen.getByText(/2\.000\.000/)).toBeInTheDocument();
  });

  it('renders an out-of-stock badge when every variant is out of stock', () => {
    renderCard(
      makeProduct({
        variants: [
          { id: 'v1', name: null, sku: 'SKU1', price: null, stockStatus: 'OUT_OF_STOCK', isDefault: true, attributes: null, displayOrder: 0 },
        ],
      }),
    );
    expect(screen.getByText(/hết hàng/i)).toBeInTheDocument();
  });

  it('does not render the star rating when averageRating is 0', () => {
    const { container } = renderCard(makeProduct({ averageRating: 0 }));
    expect(container.querySelector('svg.text-amber-400')).toBeNull();
  });

  it('renders a placeholder when there are no images', () => {
    renderCard(makeProduct({ images: [] }));
    expect(screen.queryByRole('img')).toBeNull();
  });
});
