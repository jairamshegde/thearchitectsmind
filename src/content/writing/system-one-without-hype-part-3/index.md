---
title: 'System 1 without the hype : 150 ms on a slide, 408 ms at home'
description: 'Jev and OpenAI’s Decisions API promised 10x to 193x faster decisions, and critics said the results were fragile. We tested both sides on our own transcripts: about 2x faster, equal or better accuracy, and order sensitivity only on picks the model wasn’t sure about.'
date: 2026-11-20
tags:
  - system-1
  - decisions-api
  - multi-agent
  - LLM
  - jev
  - python
series: system-one
part: 3
featured: true
draft: true
---

*System 1 without the hype, part 3 of 4*

By the end of [part 2](), three of Lectern's per-turn jobs were picks from a short list: the judge, the router, and "has the learner finished?". Each one cost about a second on a text model.

## The launch and the backlash

On 15 September 2026, TypeSafe AI launched Jev, which it called a "System One" model, after Daniel Kahneman's split between fast, automatic thinking and slow, deliberate thinking. Jev takes state and a set of typed questions and returns choices or yes/no answers with probabilities. It doesn't generate text. The launch claimed 193x faster and 444x cheaper than a large language model. On 29 September, OpenAI followed with the Decisions API, built on GPT-6 Luna, and showed about 150 ms against 1.6 s for a normal Luna call.

Critics answered within days. They said grammars on any LLM already guarantee the answer's format, that the probabilities move when you reorder the choices, and that a valid answer can still be wrong. A headline on Zeli said Jev went "from peak hype to disillusionment in record time".

Pico: "Wait. Both sides are arguing about a benchmark neither of them ran on our transcripts."

## The first benchmark

We ran Lectern's own cases through three options with `tools/bench_openai.py`, two runs per case. The cases came from real sessions: the router's 20 situations, 12 learner turns to a closures question, and 14 real fragments labelled finished or mid-thought.

| Job | DeepSeek Flash | GPT-6 Luna, normal call | Decisions API |
|---|---|---|---|
| Routing | 39/40, 0.93 / 1.21 s | 40/40, 1.33 / 1.54 s | 40/40, 0.40 / 0.64 s |
| Judge | 24/24, 0.97 / 1.07 s | 24/24, 1.54 / 2.22 s | 24/24, 0.41 / 0.51 s |
| Finished or mid-thought | 25/28, 0.81 / 1.12 s | 27/28, 0.92 / 1.07 s | 28/28, 0.41 / 0.49 s |

Latency is p50 / p90.

Decisions was fastest on every job. Then we looked at the middle column. Luna called the normal way was slower than DeepSeek on every job, and Decisions runs on that same Luna. The speed came from the endpoint, not the model family.

Pico: "The model didn't get faster. It stopped writing."

Decisions also caught every fragment. It heard "So if we pass two as a value, then we will get back." as mid-thought, the same half-sentence the old judge had graded wrong.

## The stricter benchmark

Two runs per case is a small sample, so we wrote `tools/bench_system1.py`. It ran 26 labelled cases five times each, and timed the cold first call on its own.

| Warm calls, 130 each | p50 | p90 | p99 | max |
|---|---|---|---|---|
| DeepSeek Flash, JSON answer | 921 ms | 1,127 ms | 1,238 ms | 1,277 ms |
| Decisions | 408 ms | 613 ms | 686 ms | 825 ms |

That is 2.3x faster at the median and 1.8x at p90. The slide said 150 ms. We measured 408 ms from a home connection, because the network is part of the wait the learner feels. Accuracy was 120 of 130 for Decisions against 118 for DeepSeek, and Decisions gave the same answer in all five runs of every case.

## Testing the critics

The order claim was cheap to test. The benchmark asks every question a second time with the choice list reversed:

```python
def judge_questions(reverse: bool) -> list[dict]:
    intents = [{"value": v, "description": d} for v, d in INTENTS]
    verdicts = [{"value": v, "description": d} for v, d in VERDICTS]
    if reverse:
        intents, verdicts = intents[::-1], verdicts[::-1]
    # ... the intent and verdict questions, built from these lists
```

The pick changed in 10 of 130 calls. All 10 came from the two cases with the lowest confidence. "Sorry, wait, what does remember mean here?" moved from question at 0.54 to confused at 0.65, and both readings are fair. A two-part answer cut after its first half moved from finished at 0.62 to mid-thought, which was right.

So the criticism holds, within a boundary we could measure. Order only moved picks the model was already unsure of. The confidence score showed where that boundary sits:

| Confidence | Right |
|---|---|
| 0.9 or more | 95 of 95 |
| Below 0.9 | 25 of 35 |

A call averaged 425 input tokens, about $0.00004 at Luna's input rate (an estimate, since Decisions pricing isn't published). "444x cheaper" doesn't matter when both sides cost fractions of a cent. The latency does.

| Claim | What we measured |
|---|---|
| 10x or 193x faster | About 2x, network included |
| As accurate as an LLM | 120/130 against 118/130, and deterministic |
| Order doesn't matter | Wrong below 0.65 confidence |
| Much cheaper | True, and irrelevant at our scale |

Part 4 covers what a 400 ms pick from a list let us build.
