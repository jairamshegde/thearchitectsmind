---
title: How this one question makes vibecoding fun again
description: A game developer's "always be prototyping" habit, applied to vibecoding a bookmark app with Claude Code. Nine prototypes, one dropped forest, and the decision log that kept the rabbit holes in check.
date: 2026-11-26
tags:
  - vibe-coding
  - prototype
  - claude-code
  - what-if
  - skills
  - productivity
cover: What_if_skill_Developer’s_Thoughtful_Design.png
featured: true
draft: false
---

I'm building my own AI-driven bookmark app, and the biggest problem it has to solve is simple: you save a bookmark and then forget it exists.

So I started with a what-if. What if any bookmark older than 21 days came back to be revisited?

I could have inserted some kind of timer and shown a reminder, but it would have been boring. So I didn't build one answer. I built four.

Right now it's a mock: React with Vite, Tailwind CSS and shadcn/ui. I built the variants in one worktree with Claude Code, and it took around 30 minutes, on two different days.

## Dog ear, compost, whisper, or @mentions

The four variants:

- **Dog ear.** A folded paper corner, the way you fold a page to remember it.
- **Compost.** After a while, say 21 days, a plant icon shows up saying the bookmark has composted. You rescue it by visiting the link.
- **Whisper.** An old bookmark gets a speech bubble saying something funny to get you to open it, or you can shush it.
- **@mentions.** In the app's chat, I type @ and pick any bookmark, and the LLM writes a summary of it, like the bookmark is talking to me.

Compost resonated. It was minimal and did the job, and Claude had added a few subtle touches: a summary at the top of how many bookmarks had already composted, decaying tiles with paper-crumble lines, and on each one a choice to keep it for another few days or see the gist and decide.

Compost raised a bigger idea right away: a whole forest screen, where the oldest saves are full trees and the newest are seeds. I dropped it, because it rewarded hoarding.

Then the compost idea raised a smaller question: how do you make compost look appealing? Three more prototypes:

- a bookmark shelf with torn paper
- cracked paper
- a worm eating the bookmark

The worm looked fun but heavy. The eating animation had too many moving parts to line up by just vibecoding. It may come back one day, but not now. I went with cracked paper.

And now I'm prototyping again, this time on how cracked paper should actually work as bookmarking UI and UX.

## Where the habit came from

I picked this up from a video by a solo game developer, [Why You Should ALWAYS Be Prototyping](https://www.youtube.com/watch?v=kN7oHNvwjbI). They'd shipped a demo that confused players and spent weeks redesigning the onboarding, which they called "an endless slog of redesign and redesign." Needed work, but not why they got into games.

Their fix was structural. They use AI agents for boilerplate and glue code and keep three to five git worktrees going at once. A few months before the video, they reserved one of those worktrees for prototyping, permanently. When a prototype finishes, they have to start another. They call it "the software developer's equivalent of keeping a burner going all the time."

Mine is a worktree at `../LinkMark-proto-fight-back` on a branch called `proto/fight-back`. The standard command for that setup ([git-worktree docs](https://git-scm.com/docs/git-worktree)):

```bash
git worktree add ../LinkMark-proto-fight-back -b proto/fight-back
```

An agent session pointed at that folder can't touch the branch you ship from. Two things went wrong getting it running:

- I symlinked `node_modules` into the worktree. Vite then refused to serve the fonts, with a 403 because they sat outside its fs root. Running `npm ci` inside the worktree fixed it.
- The mock data topped out at 4-day-old saves, so nothing looked old enough to compost. The prototypes needed saves aged 8 to 40 days before the aging showed at all.

## A prototype is a what-if, not a ticket

The video's test for whether something is a prototype: is there a what-if question at the core? Their example is Snow Dice, an iPhone app of theirs that showed 2D dice for years. It worked fine, and they always wondered what it would look like with 3D dice. It never felt important enough to build. In the middle of shipping an update, they finally put that question on the burner. They got 3D dice, a throw animation they were thrilled with, and a crash course in physically based rendering. Their verdict on 3D: "not as hard as I assumed."

What doesn't count: anything you already know you need. Their example is "what if the app were on Android?" People want it on Android. That's distribution work, not a question.

My bookmark reminder passes the test. "Remind users after 21 days" is a ticket. "What if old bookmarks came back in a way people actually wanted to look at?" is a question, and it took four builds to get an answer. In my log I wrote it down as: "What if forgotten bookmarks fought back against being forgotten?"

## Braid was a stack of what-ifs

The video leans on Jonathan Blow, the designer of Braid and The Witness.

Their reading of Braid is that every world in it started as a what-if. What if some things didn't respond to the rewind? What if time only moved when you moved through space? The game is the answers, organized under one idea.

Blow's own account of Braid matches. At GDC Europe in 2011 he described starting from time rewind and letting the code show him what followed ([MCV/DEVELOP, "Blow: 'Braid designed itself'"](https://mcvuk.com/development-news/blow-braid-designed-itself)):

> "I asked that question in code, and then I watched what happened."

> "There was stuff that came out of that code which could have not been foreseen."

Part of why compost won was an interaction Claude added on its own, which I hadn't planned for. The bigger surprise came after. Three of the four variants needed the same small thing: a per-bookmark "voice", which is why you saved it, a one-line summary, and the ids of related saves. Whisper used it to speak up, @mention used it to answer, and compost used it for the summary an expired link collapses into. That little bundle of data may be the real feature underneath all of them, and I'd never have found it by building the reminder timer. Asking a question in code used to cost a weekend per answer. With an agent it costs a prompt, so asking four times is cheap. The watching is still my job.

## Be wasteful on purpose

The video is blunt that prototyping should be wasteful. For the dice throw animation they built about five versions and kept one. For the whoosh when you tap the dice, they downloaded about five and threw out the ones that sucked.

I'm at nine bookmark prototypes so far, counting a few small UI and UX ones after cracked paper.

To make that waste cheap, I turned the process into a Claude skill, borrowing from two others. From [Matt Pocock's prototype skill](https://github.com/mattpocock/skills) I took the switcher: the variants live on one route, and a URL parameter plus a floating bar flips between them. That's the video's "cycled through them and then picked" in a form an agent can build in one go. The skill is still in testing. I'll publish it once it's stable.

## Take the question all the way

The video's last rule: prototyping doesn't fit in a two-week sprint. If you stop before you answer the what-if, there was no point asking. Their line: imagine telling Lewis and Clark to come home after two weeks because the exploration spike is finished.

Here's where I'd push back a little. With agents writing code this fast, following a question all the way can turn into a rabbit hole, and you lose the context of why you started. That's why I think a decision log is essential. The second idea I borrowed for my skill comes from [belchman's prototype skill](https://github.com/belchman/claude-skills/blob/master/plugins/agentic-engineering/skills/prototype/SKILL.md): record the verdict before you cut the prototype. Its line is that "the *answer* is the only thing worth keeping." Mine goes in a `PROTOTYPES.md` in the repo. Here's part of the entry for this one:

```markdown
## fight-back: What if forgotten bookmarks fought back against being forgotten?
- Branch: proto/fight-back (worktree `../LinkMark-proto-fight-back`)
- Judged by: (1) does it make you *want* to reopen an old save? (2) charming, not naggy?
- Picked: B) Compost
- Learned:
  - Symlinking node_modules into a worktree breaks Vite font serving (403 outside fs root); `npm ci` in the worktree instead.
  - Mock data needed 8–40-day-old saves for aging to show; the shipping mock tops out at 4 days.
- Next what-ifs: forest: what if compost became a forest, a separate farmland screen where the oldest saves are full trees and the newest are seeds?
```

Where cracked paper landed: each bookmark shows how many days it has left before it crumbles, with the same two choices compost had. Keep it a few more days, or open a quick-look gist and decide.

---

**Links**

- Video: [Why You Should ALWAYS Be Prototyping](https://www.youtube.com/watch?v=kN7oHNvwjbI)
- Matt Pocock's prototype skill (the variant switcher): [github.com/mattpocock/skills](https://github.com/mattpocock/skills)
- belchman's prototype skill (record the verdict before you cut): [SKILL.md](https://github.com/belchman/claude-skills/blob/master/plugins/agentic-engineering/skills/prototype/SKILL.md)
