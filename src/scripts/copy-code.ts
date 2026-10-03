/** Reveals each code frame's Copy button (hidden without JS / clipboard) and wires it up. */
export function initCopyButtons(): void {
  if (!navigator.clipboard) return;
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      const code = btn.closest('.code-frame')?.querySelector('pre')?.innerText ?? '';
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ''));
        btn.textContent = 'Copied';
      } catch {
        btn.textContent = 'Copy failed';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1600);
    });
  }
}
