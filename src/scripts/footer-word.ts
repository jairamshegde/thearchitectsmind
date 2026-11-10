/** Runs the footer heading's last word through the topics once when it scrolls into view, and again on hover. */
export function initFooterWord(): void {
  const word = document.querySelector<HTMLElement>('[data-footer-word]');
  if (!word || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const title = word.closest('p')!;
  const words = [...word.dataset.topics!.split('|'), word.textContent!];
  let running = false;
  const play = () => {
    if (running) return;
    running = true;
    words.forEach((next, i) => setTimeout(() => {
      word.classList.add('out');
      setTimeout(() => {
        word.textContent = next;
        word.classList.remove('out');
        if (i === words.length - 1) running = false;
      }, 200);
    }, 700 + i * 1300));
  };
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    play();
  }, { threshold: 0.6 }).observe(title);
  title.addEventListener('pointerenter', play);
}
