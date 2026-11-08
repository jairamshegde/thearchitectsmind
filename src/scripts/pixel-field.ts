/** The accent square in each pixel field follows the pointer cell by cell and eases back to the centre. */
export function initPixelFields(): void {
  for (const host of document.querySelectorAll<HTMLElement>('[data-pf]')) {
    const sq = host.querySelector<HTMLElement>('[data-pf-sq]');
    if (!sq) continue;
    const n = (k: string) => Number(host.dataset[k]);
    const cols = n('cols'), rows = n('rows'), cx = n('cx'), cy = n('cy'), pitch = n('pitch');
    let last = '';
    host.addEventListener('pointermove', (e) => {
      const rect = host.getBoundingClientRect();
      // the field may be scaled down on small screens; measure in its own pixels
      const scale = rect.width / host.offsetWidth || 1;
      const col = Math.max(0, Math.min(cols - 1, Math.floor((e.clientX - rect.left) / scale / pitch)));
      const row = Math.max(0, Math.min(rows - 1, Math.floor((e.clientY - rect.top) / scale / pitch)));
      const next = `translate(${(col - cx) * pitch}px, ${(row - cy) * pitch}px)`;
      if (next === last) return;
      last = next;
      sq.style.transform = next;
    });
    host.addEventListener('pointerleave', () => {
      last = '';
      sq.style.transform = '';
    });
  }
}
