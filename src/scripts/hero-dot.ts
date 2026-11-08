/**
 * The homepage hero's full stop is the missing piece of the spark.
 * On hover it flies into the spark's empty centre and the spark lights up; over the pattern it
 * follows the cursor, leaving a fading trail; on leave it flies back to the end of the sentence.
 * Without fine hover, with reduced motion, or when the pattern is hidden, the spark simply shows lit.
 */
export function initHeroDot(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const field = hero?.querySelector<HTMLElement>('[data-pf]');
  const dot = hero?.querySelector<HTMLElement>('[data-hero-dot]');
  const sq = hero?.querySelector<HTMLElement>('[data-hero-sq]');
  if (!hero || !field || !dot || !sq) return;

  const n = (k: string) => Number(field.dataset[k]);
  const cols = n('cols'), rows = n('rows'), cx = n('cx'), cy = n('cy'), pitch = n('pitch'), cell = n('cell');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rel = (el: Element) => {
    const h = hero.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { x: b.left - h.left, y: b.top - h.top, w: b.width, h: b.height };
  };
  const scale = () => field.getBoundingClientRect().width / field.offsetWidth || 1;
  const place = (x: number, y: number, size: number, radius: string, t: string) => {
    sq.style.setProperty('--t', t);
    sq.style.width = `${size}px`;
    sq.style.height = `${size}px`;
    sq.style.borderRadius = radius;
    sq.style.transform = `translate(${x}px, ${y}px)`;
  };
  const toDot = (t = '.8s') => { const d = rel(dot); place(d.x, d.y, d.w, '50%', t); };
  let at: [number, number] = [cx, cy];
  const toCell = (c: number, r: number, t: string) => {
    const f = rel(field), s = scale();
    place(f.x + c * pitch * s, f.y + r * pitch * s, cell * s, '2px', t);
    at = [c, r];
  };
  // At rest the real full stop shows. The square takes its place only while it is away,
  // measured at the moment it leaves, so late font loads and resizes never misplace it.
  const lift = () => {
    sq.style.transition = 'none';
    toDot('0s');
    void sq.offsetWidth;
    sq.style.transition = '';
    hero.classList.add('away');
  };

  if (!(canHover && !still && field.offsetParent !== null)) {
    hero.classList.add('lit');
    return;
  }
  hero.classList.add('armed');

  const cellUnder = (e: PointerEvent): [number, number] | null => {
    const f = field.getBoundingClientRect();
    if (e.clientX < f.left || e.clientX >= f.right || e.clientY < f.top || e.clientY >= f.bottom) return null;
    const p = pitch * scale();
    return [Math.min(cols - 1, Math.floor((e.clientX - f.left) / p)), Math.min(rows - 1, Math.floor((e.clientY - f.top) / p))];
  };
  const trail = ([c, r]: [number, number]) => {
    const g = document.createElement('span');
    g.className = 'pf-ghost';
    g.setAttribute('aria-hidden', 'true');
    g.style.gridArea = `${r + 1} / ${c + 1}`;
    g.addEventListener('animationend', () => g.remove());
    field.append(g);
  };

  let state: 'rest' | 'flying' | 'on' = 'rest';
  let wait = 0, land = 0, home = 0;
  hero.addEventListener('pointermove', (e) => {
    if (state === 'rest') {
      // a short dwell, so passing through on the way to the nav doesn't trigger it
      wait ||= window.setTimeout(() => {
        state = 'flying';
        clearTimeout(home);
        if (!hero.classList.contains('away')) lift();
        toCell(cx, cy, '.9s');
        land = window.setTimeout(() => { state = 'on'; hero.classList.add('lit'); }, 650);
      }, 250);
      return;
    }
    if (state !== 'on') return;
    const under = cellUnder(e);
    const next = under ?? [cx, cy];
    if (next[0] === at[0] && next[1] === at[1]) return;
    if (under) trail(at);
    toCell(next[0], next[1], '.35s');
  });
  hero.addEventListener('pointerleave', () => {
    clearTimeout(wait);
    clearTimeout(land);
    wait = 0;
    state = 'rest';
    hero.classList.remove('lit');
    if (!hero.classList.contains('away')) return;
    toDot();
    home = window.setTimeout(() => hero.classList.remove('away'), 820);
  });
}
