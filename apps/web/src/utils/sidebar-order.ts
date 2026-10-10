export type DropPosition = 'before' | 'after' | 'inside';

// Renumber the destination list so imports with duplicate order values still move correctly.
export function reorderSidebarItems<T extends { id: string; order?: number }>(
  siblings: T[],
  dragged: T,
  targetId?: string,
  position: 'before' | 'after' = 'after'
): (T & { order: number })[] {
  const items = [...siblings]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((item) => item.id !== dragged.id);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  const index = targetIndex < 0 ? items.length : targetIndex + (position === 'after' ? 1 : 0);
  items.splice(index, 0, dragged);
  return items.map((item, order) => ({ ...item, order }));
}
