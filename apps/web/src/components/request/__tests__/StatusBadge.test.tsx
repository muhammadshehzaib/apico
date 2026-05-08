import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the status code', () => {
    render(<StatusBadge statusCode={200} />);
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it('renders 404 status code', () => {
    render(<StatusBadge statusCode={404} />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  it('renders 500 status code', () => {
    render(<StatusBadge statusCode={500} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('renders 201 Created', () => {
    render(<StatusBadge statusCode={201} />);
    expect(screen.getByText(/201/)).toBeInTheDocument();
  });

  it('renders 401 Unauthorized', () => {
    render(<StatusBadge statusCode={401} />);
    expect(screen.getByText(/401/)).toBeInTheDocument();
  });

  it('applies inline background-color style', () => {
    const { container } = render(<StatusBadge statusCode={200} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.backgroundColor).toBeTruthy();
  });
});
