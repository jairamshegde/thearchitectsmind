/**
 * The homepage hero's full stop is the missing piece of the spark.
 * On hover it flies into the spark's empty centre and the spark lights up. Then it's a tiny game:
 * click to flick the full stop towards the click (farther = harder); it ricochets around the
 * pattern and knocks out the noise it hits. Three flicks, best score kept. On leave the noise
 * comes back and the full stop flies home to the end of the sentence.
 * Without fine hover, with reduced motion, or when the pattern is hidden, the spark simply shows lit.
 */
const FLICKS = 3;
const BEST_KEY = 'hero-flicks-best';

export function initHeroDot(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const field = hero?.querySelector<HTMLElement>('[data-pf]');
  const dot = hero?.querySelector<HTMLElement>('[data-hero-dot]');
  const sq = hero?.querySelector<HTMLElement>('[data-hero-sq]');
  const score = hero?.querySelector<HTMLElement>('[data-hero-score]');
  if (!hero || !field || !dot || !sq || !score) return;

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
  // the field's cell grid in hero coordinates
  const grid = () => { const f = rel(field), s = scale(); return { ox: f.x, oy: f.y, p: pitch * s, size: cell * s }; };
  let at: [number, number] = [cx, cy];
  let pos = { x: 0, y: 0 };
  const toCell = (c: number, r: number, t: string) => {
    const g = grid();
    pos = { x: g.ox + c * g.p, y: g.oy + r * g.p };
    place(pos.x, pos.y, g.size, '2px', t);
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

  const trail = ([c, r]: [number, number]) => {
    const g = document.createElement('span');
    g.className = 'pf-ghost';
    g.setAttribute('aria-hidden', 'true');
    g.style.gridArea = `${r + 1} / ${c + 1}`;
    g.addEventListener('animationend', () => g.remove());
    field.append(g);
  };

  // Noise pixels by cell. Knocking out uses `translate`, `rotate` and `filter`, which the
  // load-in keyframes (they own `transform` and `opacity`) leave alone.
  const noise = new Map<string, HTMLElement>();
  field.querySelectorAll<HTMLElement>('i.pf-n').forEach((el) => {
    noise.set(`${Number(el.style.gridColumnStart) - 1},${Number(el.style.gridRowStart) - 1}`, el);
  });
  const knocked = new Set<HTMLElement>();
  const knock = (el: HTMLElement, vx: number) => {
    knocked.add(el);
    el.style.transition = 'translate .9s cubic-bezier(.5,0,.9,.5), rotate .9s linear, filter .9s ease-in';
    el.style.translate = `${vx * 4}px ${160 + Math.random() * 80}px`;
    el.style.rotate = `${(Math.random() - 0.5) * 360}deg`;
    el.style.filter = 'opacity(0)';
  };
  const restore = () => {
    [...knocked].forEach((el, i) => {
      const d = `${(i % 17) * 0.03}s`;
      el.style.transition = `translate .6s var(--ease) ${d}, rotate .6s var(--ease) ${d}, filter .6s var(--ease) ${d}`;
      el.style.translate = el.style.rotate = el.style.filter = '';
    });
    knocked.clear();
  };

  const say = (text: string) => {
    const f = rel(field);
    score.style.left = `${f.x}px`;
    score.style.top = `${f.y + f.h + 14}px`;
    score.classList.toggle('on', !!text);
    if (text) score.textContent = text;
  };
  const best = () => Number(localStorage.getItem(BEST_KEY) ?? 0);

  let state: 'rest' | 'flying' | 'on' | 'flung' | 'over' = 'rest';
  let flicks = 0, raf = 0;
  const flick = (e: PointerEvent) => {
    const h = hero.getBoundingClientRect(), g = grid();
    // aim at the click; the distance sets the power, with a floor so a short click still moves
    let vx = (e.clientX - h.left - g.size / 2 - pos.x) * 0.06;
    let vy = (e.clientY - h.top - g.size / 2 - pos.y) * 0.06;
    const sp = Math.hypot(vx, vy);
    if (sp < 4) { vx = (vx / (sp || 1)) * 4; vy = (vy / (sp || 1)) * 4; }
    const x1 = g.ox + (cols - 1) * g.p, y1 = g.oy + (rows - 1) * g.p;
    flicks++;
    state = 'flung';
    hero.classList.add('flung');
    const tick = () => {
      pos.x += vx; pos.y += vy;
      if (pos.x < g.ox || pos.x > x1) { vx = -vx * 0.8; pos.x = Math.max(g.ox, Math.min(x1, pos.x)); }
      if (pos.y < g.oy || pos.y > y1) { vy = -vy * 0.8; pos.y = Math.max(g.oy, Math.min(y1, pos.y)); }
      vx *= 0.96; vy *= 0.96;
      const c = Math.round((pos.x - g.ox) / g.p), r = Math.round((pos.y - g.oy) / g.p);
      if (c !== at[0] || r !== at[1]) {
        trail(at);
        place(g.ox + c * g.p, g.oy + r * g.p, g.size, '2px', '.05s');
        at = [c, r];
        const el = noise.get(`${c},${r}`);
        if (el && !knocked.has(el)) { knock(el, vx); say(`${knocked.size} cleared`); }
      }
      if (Math.hypot(vx, vy) < 0.4) return settle();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  const settle = () => {
    hero.classList.remove('flung');
    const cleared = knocked.size;
    if (flicks < FLICKS) {
      state = 'on';
      const left = FLICKS - flicks;
      return say(`${cleared} cleared · ${left} flick${left === 1 ? '' : 's'} left`);
    }
    state = 'over';
    const was = best();
    if (cleared > was) localStorage.setItem(BEST_KEY, String(cleared));
    say(`${cleared} of ${noise.size} cleared${cleared > was ? ' · new best' : ` · best ${was}`}. Click to go again.`);
  };
  hero.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('a, button')) return;
    if (state === 'over') {
      restore();
      flicks = 0;
      state = 'on';
      return say('Three flicks. Go.');
    }
    if (state === 'on') flick(e);
  });

  let wait = 0, land = 0, home = 0;
  hero.addEventListener('pointermove', () => {
    if (state !== 'rest') return;
    // a short dwell, so passing through on the way to the nav doesn't trigger it
    wait ||= window.setTimeout(() => {
      state = 'flying';
      clearTimeout(home);
      if (!hero.classList.contains('away')) lift();
      toCell(cx, cy, '.9s');
      land = window.setTimeout(() => {
        state = 'on';
        flicks = 0;
        hero.classList.add('lit');
        say('Three flicks. Clear as much noise as you can. Click to flick.');
      }, 650);
    }, 250);
  });
  hero.addEventListener('pointerleave', () => {
    clearTimeout(wait);
    clearTimeout(land);
    cancelAnimationFrame(raf);
    wait = 0;
    state = 'rest';
    hero.classList.remove('lit', 'flung');
    restore();
    say('');
    if (!hero.classList.contains('away')) return;
    toDot();
    home = window.setTimeout(() => hero.classList.remove('away'), 820);
  });
}
