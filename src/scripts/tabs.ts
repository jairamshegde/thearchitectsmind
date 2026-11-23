type Tab = 'writing' | 'notes';

/**
 * Writing / Notes tabs on the homepage band. Also takes over the header's Writing and Notes links,
 * so they open the right tab instead of leaving the page.
 */
export function initTabs(): void {
  const band = document.querySelector<HTMLElement>('[data-tabs]');
  if (!band) return;
  const tabs = [...band.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const all = band.querySelector<HTMLAnchorElement>('[data-all]');

  const select = (name: Tab, focus = false) => {
    for (const tab of tabs) {
      const on = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !on;
      if (on && focus) tab.focus();
    }
    if (all) {
      all.textContent = name === 'writing' ? 'All writing' : 'All notes';
      all.href = (name === 'writing' ? band.dataset.writingHref : band.dataset.notesHref) ?? all.href;
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.tab as Tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(next.dataset.tab as Tab, true);
    });
  });

  const open = (name: Tab) => (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab or window
    e.preventDefault();
    select(name);
    band.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-nav="writing"], [data-tab-link="writing"]')) link.addEventListener('click', open('writing'));
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-nav="notes"], [data-tab-link="notes"]')) link.addEventListener('click', open('notes'));

  if (location.hash === '#notes') select('notes');
}
