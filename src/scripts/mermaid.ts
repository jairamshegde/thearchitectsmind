type MermaidApi = (typeof import('mermaid'))['default'];

let api: Promise<MermaidApi> | undefined;
let counter = 0;
const load = () => (api ??= import('mermaid').then((m) => m.default));

/** Mermaid theme variables read from the live design tokens, so diagrams follow light/dark. */
function themeVariables() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    fontFamily: v('--font-sans'),
    fontSize: '14px',
    background: v('--card'),
    mainBkg: v('--card'),
    primaryColor: v('--card'),
    primaryTextColor: v('--ink'),
    textColor: v('--ink'),
    primaryBorderColor: v('--ink'),
    nodeBorder: v('--ink'),
    lineColor: v('--ink'),
    secondaryColor: v('--page'),
    tertiaryColor: v('--page'),
    clusterBkg: v('--page'),
    clusterBorder: v('--line-2'),
    edgeLabelBackground: v('--card'),
  };
}

function showSource(panel: HTMLElement, source: string): void {
  const note = document.createElement('p');
  note.className = 'mermaid-note';
  note.textContent = "This diagram couldn't be drawn, so here's its source.";
  const pre = document.createElement('pre');
  pre.className = 'mermaid-src';
  pre.textContent = source;
  panel.replaceChildren(note, pre);
  panel.classList.remove('is-rendered');
  panel.classList.add('is-error');
}

async function renderAll(panels: HTMLElement[]): Promise<void> {
  const mermaid = await load();
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: themeVariables() });
  for (const panel of panels) {
    const source = panel.dataset.source ?? '';
    const id = `mermaid-${++counter}`;
    try {
      const { svg } = await mermaid.render(id, source);
      panel.innerHTML = svg;
      panel.classList.remove('is-error');
      panel.classList.add('is-rendered');
    } catch {
      document.getElementById(`d${id}`)?.remove(); // Mermaid leaves an error node behind
      document.getElementById(id)?.remove();
      showSource(panel, source);
    }
  }
}

export function initMermaid(): void {
  const panels = [...document.querySelectorAll<HTMLElement>('[data-mermaid]')];
  if (panels.length === 0) return; // Mermaid is never downloaded on pages without diagrams
  for (const panel of panels) panel.dataset.source ??= panel.querySelector('.mermaid-src')?.textContent ?? '';
  void renderAll(panels);
  document.addEventListener('themechange', () => void renderAll(panels));
}
