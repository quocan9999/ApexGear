import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Hết hàng</Badge>);
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
  });

  it('applies the error variant styles', () => {
    render(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-red-50');
  });

  it('applies the success variant styles', () => {
    render(<Badge variant="success">Ok</Badge>);
    expect(screen.getByText('Ok').className).toContain('bg-green-50');
  });

  it('defaults to the default variant', () => {
    render(<Badge>Plain</Badge>);
    expect(screen.getByText('Plain').className).toContain('bg-surface-container');
  });

  it('merges a custom className', () => {
    render(<Badge className="absolute">Pos</Badge>);
    expect(screen.getByText('Pos').className).toContain('absolute');
  });
});
