import { describe, expect, it } from 'vitest';
import { BASE, page } from './helpers';

describe('full case study', () => {
  const p = page('/projects/order-pipeline-redesign/');

  it('shows kicker, title, summary and the meta grid', () => {
    expect(p.querySelector('.article-kicker')?.text).toBe('Case study · 2026');
    expect(p.querySelector('h1.article-title')?.text).toBe('Order pipeline redesign');
    const meta = Object.fromEntries(p.querySelectorAll('.cs-meta > div').map((d) => [d.querySelector('dt')!.text, d.querySelector('dd')!]));
    expect(Object.keys(meta)).toEqual(['Role', 'Timeline', 'Stack', 'Links']);
    expect(meta.Stack.querySelectorAll('.chips li').map((l) => l.text)).toEqual(['Python', 'FastAPI', 'PostgreSQL', 'Kafka']);
    expect(meta.Links.querySelector('a')?.getAttribute('href')).toMatch(/^https:\/\/github\.com\//);
  });

  it('renders Problem / Constraints / Outcome cards with markdown', () => {
    const cards = p.querySelectorAll('.cs-card');
    expect(cards.map((c) => c.querySelector('.cs-card-title')?.text)).toEqual(['Problem', 'Constraints', 'Outcome']);
    expect(cards[0].querySelector('strong')?.text).toBe('synchronously');
  });

  it('renders the body with a diagram, then Lessons, then a back link', () => {
    expect(p.querySelector('.prose figure.mermaid-panel')).not.toBeNull();
    expect(p.querySelector('aside.lessons')?.text).toContain('Model the outbox table first');
    expect(p.querySelector('.back-link')?.getAttribute('href')).toBe(`${BASE}/projects/`);
  });
});

describe('light project', () => {
  const p = page('/projects/dotfiles-cli/');

  it('shows only summary, stack and links', () => {
    expect(p.querySelector('.article-kicker')?.text).toBe('Project · 2025');
    expect(p.querySelectorAll('.cs-meta dt').map((d) => d.text)).toEqual(['Stack', 'Links']);
    expect(p.querySelector('.cs-cards')).toBeNull();
    expect(p.querySelector('aside.lessons')).toBeNull();
  });
});
