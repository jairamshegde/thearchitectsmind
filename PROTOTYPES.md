# Prototypes

Check out an archived prototype with `git switch -c <name> proto-archive/<slug>`.

## hero-surprise: What if the hero's full stop made visitors go "ha, that's new"?
- Status: kept (C1), shipped on feat/hero-flick-game
- Branch: archived as tag proto-archive/hero-surprise
- Judged by: a "ha" within a few seconds of hovering; still restrained and true to "the full stop is the missing piece"
- Variations: 0) current. A) Make way: noise pixels part around the full stop as it moves. B) Run-on: with the full stop gone, the sentence under the headline keeps typing on and asks for it back. C) Fling: click to flick the full stop; it ricochets and knocks noise pixels out of the field. D) Elusive: the full stop dodges the cursor; corner it to catch it and the spark flashes orange.
- Round 2 (user liked C, asked for a tiny game): the full stop now rests where it stops; click where it should go, farther = harder. C1) Three flicks: clear as much noise as you can in 3 flicks, best score saved. C2) Find the signal: bank the full stop off an edge into an orange pixel (direct hits don't count). C3) Put it back: flick the full stop out of the field and land it in the gap after "intuition".
- Switcher: `npx astro dev` in the worktree, open `/?variant=g1` (round 2: c, g1, g2, g3; round 1 code for 0, a, b, d still works by URL); floating bar at the bottom
- Picked: C1 Three flicks
- Why: it's fun; only three clicks and you try to maximise the score. Short, replayable, no explanation needed.
- Learned: round 1 (make way, run-on, fling, elusive) showed the click-to-fling mechanic was the interesting one. Aiming (click where it should go, distance = power) turned it from a toy into a skill. A free-aim target game was trivially won by aiming straight, so a rule like a bank shot is needed. CSS `translate`/`filter` let JS move and hide pixels without fighting the `forwards` keyframe animations that own `transform`/`opacity`.
- Next what-ifs: C3 (flick the full stop home into the sentence) as a finale after the third flick; a touch version for phones.

## project-page: What if the project page moved its facts and Problem/Constraints out of the cramped cards?
- Status: kept, shipped on feat/project-page
- Branch: archived as tag proto-archive/project-page
- Judged by: the header stops feeling cramped; Problem and Constraints read naturally instead of as odd boxes
- Variations: A) facts rail in the left column (year, role, stack, links, then "On this page"), Problem/Constraints as small-labelled text at the top of the write-up  B) design-review table: ruled label/value rows under the title  C) at-a-glance band: full-width header and cover, facts in one row, Problem/Constraints as side-by-side text columns  D) story: one meta line like posts, Problem/Constraints become the first headed sections of the write-up  Z) today
- Switcher: `npx astro dev --port 4325` in this worktree, open a project page, bar at bottom right, keys a-d/z, or `?p=a..d|z`
- Round 1 verdict: B, but Stack moves to a sidebar (from A) and the table keeps only Problem (+ Constraints/Outcome when present) and Links; Lessons card removed.
- Round 2: E) that combination, now the default.
- Picked: E with the table limited to Problem and Links (Constraints and Outcome not shown); sidebar position as is.
- Why: the facts table reads like a review sheet without boxes; stack is a fact that belongs beside the text, not in the way of it; Lessons and Constraints added clutter.
- Learned: the expense project's Problem/Constraints are still "coming soon.." placeholders, which makes any layout look empty.
- Next what-ifs:
- Learned: the switcher must not mark <html> with the same attribute it uses to find and remove its own nodes (switching blanked the page).

## fonts: What if post and note pages used Inter or Roboto at heavier weights instead of Funnel Display + Inter Tight 400?
- Status: kept, shipped on feat/reading-pages
- Branch: archived as tag proto-archive/fonts
- Judged by: body text reads comfortably and does not look thin; titles read like an article heading, not a hero
- Variations: A) current, Funnel Display titles + Inter Tight 400 body  B) Inter 450 body, Inter 700 titles  C) Inter 500 body, Inter 600 titles at 42px max  D) Roboto 400 body, Roboto 700 titles  E) Inter Tight 500 body, Inter Tight 700 titles (weight only)
- Switcher: `npx astro dev --port 4323` in this worktree, open any post or note, use the bar at bottom right, keys 1-5, or `?font=a..e`. The choice carries across pages. B-E also turn off `-webkit-font-smoothing: antialiased` on article pages.
- Round 1 pick: Inter 450 for body text. Titles needed a better font.
- Round 2 variations (all Inter 450 body, titles 44px max): B) Inter 700  C) Inter Display 650  D) Geist 600  E) Instrument Sans 600  F) Newsreader 500 serif
- Round 2 pick: E, Instrument Sans 600 titles; descriptions stay Inter.
- Round 3 variations (text column width, fonts fixed): A) 860px today  B) 800  C) 760  D) 720  E) 680. Switcher param is now `?w=a..e`.
- Round 3 pick: C, 760px text column.
- Round 4 variations (cover placement, desktop only): A) today, full width after metadata  B) under the description, full width  C) under the description, in the text column  D) one column: header, cover and metadata all in the text column (also lines up note headers with the body)  E) cover beside title and description. Switcher param is now `?c=a..e`.
- Round 4 verdict: none of A-E. Drop the description on post pages (keep it on home and writing index cards) and put the cover above the title.
- Round 5 variations: A) today  B) no description, cover above title, full width  C) same, one column lined up with the text.
- Round 5 pick: C, one column. Also drop the description on notes; meta description stays for search and share previews.
- Round 6: title held to the 760px column with balanced wrapping (text-wrap: pretty still left an orphan word); cover sizes A) 760x428 16:9  B) 760x380 2:1  C) 760x325 21:9  D) 620x349 16:9.
- Round 6 pick: B, cover 760x380 (2:1).
- Round 7: two groups. Title 1) 44px balanced  2) 38px balanced  3) 40px fills the column. Meta A) labelled row  B) one line date · time · tags  C) date above title, tags at the end  D) labels left, tags right. Params `?t=1..3&m=a..d`; keys 1-3 and a-d.
- Picked: Instrument Sans 600 titles at 40px filling the column; Inter 450 body; 760px column; no description on posts or notes; cover 760x380 above the title; one column lined up with the text; date · reading time (· part) on one line under a 2px rule; tags at the end of the post.
- Why: titles and covers read like a hero before; the user wants posts to read as articles. Tags matter after reading, not before.
- Learned: global styles in a layout component do not hot-reload in astro dev; restart the server after editing them. The thin look comes partly from `antialiased` smoothing on macOS, not only from the 400 weight.
- Next what-ifs: cover image placement under the description vs beside the title vs inside the text column
- Round 9 feedback: Inter 450 with smoothing off looks too bold; the back link looks flat. Variations: body x) 450 smoothing off  y) 400 smoothing off  z) 400 smoothing on; back p) outline pill  q) soft filled pill  r) text link. Params `?w=x..z&k=p..r`.
- Learned: headless screenshots do not show the macOS smoothing difference; weight has to be judged in a real browser.
- Round 9 pick: z (Inter 400, keep antialiased smoothing) and p (outline pill back link).
- Round 10: long titles felt crowded; title line-height 1.12 -> 1.2, letter-spacing -.025em -> -.012em.
- Round 11 (homepage height, new fonts in B-D): A) today, series 557px + writing 737px  B) same layout, 28-32px names, 56px section padding: 464 + 515  C) B with a 4-column left side and 8-column lists: 372 + 468  D) no left column, name as a header row, parts in 2 columns, full-width writing list: 418 + 477. Param `?h=a..d`.
- Round 11 pick: series C; writing tab D without its description line; notes tab D (description kept). Series 557 -> 372px, writing tab 737 -> 445px, notes tab 593px.
- Round 11 correction: notes tab also drops its description; note cards keep today's size.
- Round 11 correction 2: note cards 3 per row, full width (416px each at 1440).
