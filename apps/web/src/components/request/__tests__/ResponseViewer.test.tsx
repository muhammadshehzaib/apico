import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponseViewer } from '../ResponseViewer';

const jsonBody = JSON.stringify({ id: 1, name: 'Test', active: true });
const plainBody = 'plain text response';
const headers = { 'content-type': 'application/json', 'x-request-id': 'abc-123' };

describe('ResponseViewer', () => {
  it('renders Body tab active by default', () => {
    render(<ResponseViewer body={jsonBody} headers={headers} />);
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Headers')).toBeInTheDocument();
  });

  it('renders body content on the Body tab', () => {
    render(<ResponseViewer body={plainBody} headers={headers} />);
    expect(screen.getByText(plainBody)).toBeInTheDocument();
  });

  it('switches to Headers tab and shows header keys', () => {
    render(<ResponseViewer body={jsonBody} headers={headers} />);
    fireEvent.click(screen.getByText('Headers'));
    expect(screen.getByText(/content-type/)).toBeInTheDocument();
  });

  it('pretty-prints valid JSON body', () => {
    render(<ResponseViewer body={jsonBody} headers={headers} />);
    expect(screen.getByText(/"name"/)).toBeInTheDocument();
  });

  it('renders plain text body without throwing', () => {
    render(<ResponseViewer body={plainBody} headers={headers} />);
    expect(screen.getByText(plainBody)).toBeInTheDocument();
  });

  it('renders Diff tab when responseHistory has more than one entry', () => {
    const history = [
      { result: { body: jsonBody, headers }, at: new Date().toISOString() },
      { result: { body: '{"id":2}', headers }, at: new Date().toISOString() },
    ];
    render(<ResponseViewer body={jsonBody} headers={headers} responseHistory={history} />);
    expect(screen.getByText('Diff')).toBeInTheDocument();
  });

  it('does not crash with empty body', () => {
    render(<ResponseViewer body="" headers={{}} />);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('does not crash with empty headers object', () => {
    render(<ResponseViewer body={jsonBody} headers={{}} />);
    fireEvent.click(screen.getByText('Headers'));
    expect(screen.getByText('Headers')).toBeInTheDocument();
  });
});
