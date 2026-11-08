/** Marks the "On this page" link for the section currently at the top of the viewport. */
export function initTocRail(): void {
  const nav = document.querySelector<HTMLElement>('[data-toc]');
  if (!nav) return;
  const pairs = [...nav.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')]
    .map((link) => ({ link, target: document.getElementById(link.dataset.tocLink ?? '') }))
    .filter((p): p is { link: HTMLAnchorElement; target: HTMLElement } => p.target !== null);
  if (pairs.length === 0) return;

  // A jump lands a heading ~120px down (scroll-padding 96 + scroll-margin 24), give or take a sub-pixel; stay clear of that line.
  const OFFSET = 128;
  let queued = false;
  const update = () => {
    queued = false;
    let active = 0;
    pairs.forEach((p, i) => { if (p.target.getBoundingClientRect().top - OFFSET <= 0) active = i; });
    pairs.forEach((p, i) => {
      p.link.classList.toggle('is-active', i === active);
      if (i === active) p.link.setAttribute('aria-current', 'true');
      else p.link.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
