---
title: 'System 1 without the hype :  Anything code knows, code decides'
description: 'Our router’s model kept breaking lesson rules, even when we gave it an enum of allowed values. It took four rounds of an eval to learn the fix: take away every choice code can make, so the model is left with one small pick.'
date: 2026-11-19
tags:
  - system-1
  - decisions-api
  - LLM
  - multi-agent
  - python
  - jev
cover: cover-2-anything-code-knows-code-decides.png
series: system-one
part: 2
featured: true
draft: true
---

*System 1 without the hype, part 2 of 4*

In [part 1](), Lectern, our voice tutor, kept grading half-sentences, and four of its five per-turn jobs turned out to be picks from a list. This post is about the router, the one of those jobs we had to shrink before any faster model could help.

## A router that broke the rules

A lesson in Lectern is a sequence of teaching moves we call tricks. `explain` teaches the next concept, `ask_question` checks the one just taught, and `side_question` answers whatever the learner just asked. The rules about which tricks are allowed live in code. For example, after a run of explaining, the learner has to be involved, and a shaky concept gets checked again before the next one builds on it.

The router picks the next trick. In the first design DeepSeek Flash did that as a tool call, with each allowed trick offered as a tool. Before the first run we fixed a pass bar: 40 of 40 calls valid, at least 36 of 40 acceptable, and p90 under 2 s. If it failed, we would change the design, not the bar.

It failed three times.

| Round | What the model chose | Result |
|---|---|---|
| 1 | The trick, and the concept as a free string | Failed. It picked a concept that wasn't allowed yet |
| 2 | The trick, and the concept as an enum of allowed ids | Failed. DeepSeek doesn't enforce enums |
| 3 | Only the trick. Code picks the concept | Failed once. No call came back under `tool_choice="required"` |
| 4 | As round 3. When only one trick is allowed, code forces it by name | Passed. 40/40 valid, 39/40 acceptable, p90 1.18 s |

Round 1 nearly passed. It got 38 of 40 acceptable choices, well over the bar. The one invalid call was what mattered: the model picked a concept the learner had already understood, which the rules didn't allow. A rule the model could break, it sometimes broke.

Round 2 was the obvious fix. Put the allowed concepts in an enum and let the schema stop it. The schema didn't stop it, because the provider doesn't enforce enums.

Pico: "So the schema was a suggestion."

## Removing the choice

The fix in round 3 wasn't a better prompt. It took the choice away. Which concept comes next is a fact. For `explain` it's the next concept in teaching order, and for `ask_question` it's the current one. Code knows both, so code picks them, and the model only says which trick.

This is the function that does it in `lectern/lesson.py`. It returns each allowed trick with the concept code has already chosen for it:

```python
def allowed(state: LessonState, kit: Kit, learner_spoke: bool = False, cut: str | None = None) -> dict[str, str | None]:
    """Trick name -> the concept code has chosen for it (None for side_question)."""
    tricks: dict[str, str | None] = {}
    if cut:
        return {"explain": cut} | ({"side_question": None} if learner_spoke else {})
    upcoming = next_concept(state, kit)
    if can_ask(state, kit):
        tricks["ask_question"] = state.current
    # A shaky concept is checked again before the next one builds on it.
    shaky = "ask_question" in tricks and state.status[state.current] == "shaky"
    if upcoming and state.teaching_streak < MAX_STREAK and not shaky:
        tricks["explain"] = upcoming
    if upcoming and not tricks:  # nothing to ask about: the streak rule gives way rather than stall
        tricks["explain"] = upcoming
    if learner_spoke:
        tricks["side_question"] = None
    return tricks
```

Round 4 added one more step. When code allows only one trick, there is nothing to decide, so code forces it by name. The router we run today goes further and skips the model call entirely in that case. It also checks the model's pick against the allowed set before acting on it (from `lectern/routing.py`):

```python
if len(allowed) == 1 and not learner_spoke:
    return next(iter(allowed)), "the only trick allowed"
# ... ask the model ...
if pick not in allowed and not (pick in ("listen", "hold") and learner_spoke):
    return fallback(allowed, learner_spoke), f"decision picked {pick}, not allowed: fallback"
```

Taking the concept away cost nothing in teaching quality, and the guardrails could now be unit-tested as plain functions. We took one rule from this eval and kept it for the rest of the project. Anything code knows, code decides.

Pico: "The fastest model call is the one you didn't make."

## What was left

After round 4 the model's job was small. It read the conversation and picked one of two or three allowed tricks. That's a multiple-choice question, and it was still taking about a second at p50, because a text model was answering it by writing out a tool call.

That made the router the same kind of job as the judge and the "has the learner finished?" check from part 1. All three pick from a fixed list. None of them needs a model that writes.

Around then, the industry noticed the same thing and gave it a name, System 1. Part 3 is about what happened when we measured that claim on our own transcripts.
