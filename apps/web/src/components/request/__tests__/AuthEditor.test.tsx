import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthEditor } from '../AuthEditor';
import { RequestAuth } from '@/types';

const noneAuth: RequestAuth = { type: 'none' };
const bearerAuth: RequestAuth = { type: 'bearer', token: 'my-token' };
const basicAuth: RequestAuth = { type: 'basic', username: 'user', password: 'pass' };
const apiKeyAuth: RequestAuth = { type: 'apikey', apiKey: 'X-API-Key', apiValue: 'secret', apiIn: 'header' };

describe('AuthEditor', () => {
  it('renders all auth type buttons', () => {
    render(<AuthEditor auth={noneAuth} onChange={vi.fn()} />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Bearer Token')).toBeInTheDocument();
    expect(screen.getByText('Basic Auth')).toBeInTheDocument();
    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  it('shows no-auth message when type is none', () => {
    render(<AuthEditor auth={noneAuth} onChange={vi.fn()} />);
    expect(screen.getByText('No authentication configured')).toBeInTheDocument();
  });

  it('calls onChange with bearer type when Bearer Token is clicked', () => {
    const onChange = vi.fn();
    render(<AuthEditor auth={noneAuth} onChange={onChange} />);
    fireEvent.click(screen.getByText('Bearer Token'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'bearer' }));
  });

  it('calls onChange with basic type when Basic Auth is clicked', () => {
    const onChange = vi.fn();
    render(<AuthEditor auth={noneAuth} onChange={onChange} />);
    fireEvent.click(screen.getByText('Basic Auth'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'basic' }));
  });

  it('renders bearer token input when type is bearer', () => {
    render(<AuthEditor auth={bearerAuth} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Your bearer token')).toBeInTheDocument();
  });

  it('masks bearer token by default and reveals on Show click', () => {
    render(<AuthEditor auth={bearerAuth} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Your bearer token') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByText('Show'));
    expect(input.type).toBe('text');
  });

  it('calls onChange when bearer token input changes', () => {
    const onChange = vi.fn();
    render(<AuthEditor auth={bearerAuth} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Your bearer token'), {
      target: { value: 'new-token' },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token' }));
  });

  it('renders username and password inputs for basic auth', () => {
    render(<AuthEditor auth={basicAuth} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('masks basic auth password by default', () => {
    render(<AuthEditor auth={basicAuth} onChange={vi.fn()} />);
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('renders API key inputs when type is apikey', () => {
    render(<AuthEditor auth={apiKeyAuth} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g., X-API-Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your API key')).toBeInTheDocument();
  });

  it('renders header and query radio buttons for apikey', () => {
    render(<AuthEditor auth={apiKeyAuth} onChange={vi.fn()} />);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Query Parameter')).toBeInTheDocument();
  });

  it('calls onChange when apiIn is changed to query', () => {
    const onChange = vi.fn();
    render(<AuthEditor auth={apiKeyAuth} onChange={onChange} />);
    fireEvent.click(screen.getByText('Query Parameter'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ apiIn: 'query' }));
  });
});
