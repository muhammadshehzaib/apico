import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';
import React from 'react';

describe('Badge Component', () => {
    it('renders children correctly', () => {
        render(<Badge>Test Badge</Badge>);
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
        const { rerender } = render(<Badge variant="success">Success</Badge>);
        let badge = screen.getByText('Success');
        expect(badge).toHaveClass('bg-success');

        rerender(<Badge variant="danger">Danger</Badge>);
        badge = screen.getByText('Danger');
        expect(badge).toHaveClass('bg-danger');
    });

    it('applies custom className', () => {
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
});
