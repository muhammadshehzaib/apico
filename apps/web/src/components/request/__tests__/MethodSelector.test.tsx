import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MethodSelector } from '../MethodSelector';
import { HttpMethod } from '@/types';

describe('MethodSelector', () => {
  it('renders the current method', () => {
    render(<MethodSelector method={HttpMethod.GET} onChange={vi.fn()} />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('opens dropdown on button click', () => {
    render(<MethodSelector method={HttpMethod.GET} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('GET'));
    expect(screen.getAllByText('GET').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('PUT')).toBeInTheDocument();
    expect(screen.getByText('PATCH')).toBeInTheDocument();
    expect(screen.getByText('DELETE')).toBeInTheDocument();
  });

  it('calls onChange with POST when POST is selected', () => {
    const onChange = vi.fn();
    render(<MethodSelector method={HttpMethod.GET} onChange={onChange} />);
    fireEvent.click(screen.getByText('GET'));
    fireEvent.click(screen.getByText('POST'));
    expect(onChange).toHaveBeenCalledWith(HttpMethod.POST);
  });

  it('calls onChange with DELETE when DELETE is selected', () => {
    const onChange = vi.fn();
    render(<MethodSelector method={HttpMethod.GET} onChange={onChange} />);
    fireEvent.click(screen.getByText('GET'));
    fireEvent.click(screen.getByText('DELETE'));
    expect(onChange).toHaveBeenCalledWith(HttpMethod.DELETE);
  });

  it('renders PATCH as current method correctly', () => {
    render(<MethodSelector method={HttpMethod.PATCH} onChange={vi.fn()} />);
    expect(screen.getByText('PATCH')).toBeInTheDocument();
  });
});
