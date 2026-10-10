import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HistorySidebar } from '../HistorySidebar';

vi.mock('react-redux', () => ({ useSelector: () => 'workspace' }));
vi.mock('@/hooks/useCollections', () => ({ useCollections: () => ({ collections: [] }) }));
vi.mock('@/components/collections/CollectionsSidebar', () => ({ CollectionsSidebar: () => <div>Collection contents</div> }));
vi.mock('@/components/collections/SaveRequestModal', () => ({ SaveRequestModal: () => null }));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('PointerEvent', MouseEvent);
});
afterEach(() => vi.unstubAllGlobals());

function setup() {
  const view = render(<HistorySidebar history={[]} onNewRequest={vi.fn()} onLoadRequest={vi.fn()}
    isLoading={false} currentRequest={{ method: 'GET', url: '' }} onSaveRequest={vi.fn()} />);
  const divider = screen.getByRole('separator', { name: 'Resize History and Collections' });
  Object.defineProperty(divider, 'setPointerCapture', { value: vi.fn() });
  vi.spyOn(divider.parentElement!, 'getBoundingClientRect').mockReturnValue({ top: 100, height: 608 } as DOMRect);
  return { ...view, divider };
}

describe('History and Collections divider', () => {
  it('drags upward to give Collections more space and stops on release', () => {
    const { divider } = setup();
    fireEvent.pointerDown(divider, { button: 0, clientY: 404 });
    fireEvent.pointerMove(divider, { clientY: 254 });
    expect(divider).toHaveAttribute('aria-valuenow', '25');
    expect(document.getElementById('sidebar-collections')?.style.flexGrow).toBe('0.75');
    fireEvent.pointerUp(divider);
    fireEvent.pointerMove(divider, { clientY: 554 });
    expect(divider).toHaveAttribute('aria-valuenow', '25');
    expect(document.body.style.cursor).toBe('');
  });

  it('keeps both panels available at the drag limits', () => {
    const { divider } = setup();
    fireEvent.pointerDown(divider, { button: 0 });
    fireEvent.pointerMove(divider, { clientY: -100 });
    expect(divider).toHaveAttribute('aria-valuenow', '15');
    fireEvent.pointerMove(divider, { clientY: 2000 });
    expect(divider).toHaveAttribute('aria-valuenow', '85');
    fireEvent.pointerCancel(divider);
    expect(document.body.style.userSelect).toBe('');
  });

  it('remembers the chosen size and supports keyboard adjustments and reset', () => {
    const { divider, unmount } = setup();
    fireEvent.keyDown(divider, { key: 'ArrowUp', shiftKey: true });
    expect(localStorage.getItem('apico_history_panel_share')).toBe('0.4');
    unmount();
    const next = setup();
    expect(next.divider).toHaveAttribute('aria-valuenow', '40');
    fireEvent.doubleClick(next.divider);
    expect(next.divider).toHaveAttribute('aria-valuenow', '50');
  });

  it('restores document styles if unmounted during a drag', () => {
    const { divider, unmount } = setup();
    fireEvent.pointerDown(divider, { button: 0 });
    expect(document.body.style.cursor).toBe('row-resize');
    unmount();
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });
});
