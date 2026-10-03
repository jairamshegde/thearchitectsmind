/**
 * Handwritten notes marked [data-reveal-note] write themselves in when they scroll into view
 * (or the page jumps to them from the nav). Without JS the note simply stays visible.
 */
export function initRevealNotes(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal-note]');
  if (targets.length === 0 || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.5 },
  );
  for (const el of targets) {
    el.classList.add('reveal-ready'); // only now hide the note, so no-JS visitors always see it
    observer.observe(el);
  }
}
