/** Hovering or focusing a project row shows its panel in the sticky stage. */
export function initProjectStage(): void {
  for (const root of document.querySelectorAll<HTMLElement>('[data-proj]')) {
    const rows = [...root.querySelectorAll<HTMLElement>('[data-proj-row]')];
    const panels = [...root.querySelectorAll<HTMLElement>('[data-stage-panel]')];
    const activate = (i: number) => {
      rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
      panels.forEach((p, j) => (p.hidden = j !== i));
    };
    rows.forEach((row, i) => {
      row.addEventListener('mouseenter', () => activate(i));
      row.addEventListener('focus', () => activate(i));
    });
  }
}
