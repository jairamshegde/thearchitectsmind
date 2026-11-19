---
title: 'System 1 without the hype : What a 400 ms classifier let us build'
description: A fast, cheap pick from a list let our tutor ask “has the learner finished?” on every turn, so it stopped grading half-sentences. This post covers the judge call, the routing loop, a schema bug we caused ourselves, and steps to try this on your own system.
date: 2026-11-20
tags:
  - system-1
  - jev
  - LLM
  - decisions-api
  - python
  - multi-agent
cover: cover-4-what-a-fast-classifier-let-us-build.png
series: system-one
part: 4
featured: true
draft: true
---

# What a 400 ms classifier let us build

*System 1 without the hype, part 4 of 4*

In [part 3](3-150-ms-on-a-slide-408-ms-at-home.md), the Decisions API picked from a list about twice as fast as DeepSeek Flash, with equal or better accuracy. In this post we move Lectern's judge and router onto it, and find out what a cheap pick from a list is worth in a live lesson.

## One call, three questions

The judge now makes one Decisions call per learner turn and asks three typed questions at once: what the learner is doing, how right their answer is, and which known mistake it matches. Each choice carries a description, and the descriptions do the job a prompt used to do. This is from `lectern/judge.py`:

```python
INTENTS = [
    ("answer", "answering the open question, or trying to, including I don't know"),
    # ... question, confused, go_on, backchannel
    ("thinking", "stopped at a pause in the middle of a thought and is likely to carry on: an unfinished "
                 "sentence, or reasoning that has not reached its point yet"),
    ("hold", "asks for a moment: to open the file, find a line, or think it over, such as hold on, one sec"),
    ("other", "anything else"),
]

d = await client.decisions.create(model="gpt-6-luna", input=text, questions=[
    {"type": "choice", "name": "intent", "instructions": "What is the learner doing in this turn?",
     "choices": [{"value": v, "description": t} for v, t in INTENTS]},
    {"type": "choice", "name": "verdict",
     "instructions": "If the learner is answering, how right is the answer against the expected answer?",
     "choices": [{"value": v, "description": t} for v, t in VERDICTS]},
    {"type": "choice", "name": "mistake",
     "instructions": "If the learner is answering, which of these likely mistakes does it match?",
     "choices": mistakes}])
picks = {a.name: a.choice for a in d.answers if a.type == "choice"}
```

The `thinking` intent is the one from part 1, the check we couldn't afford at every pause. It is now one more choice in a call the judge was making anyway. When the learner pauses mid-thought, Lectern says nothing and joins the next turn to this one, so one thought counts as one answer and costs one attempt.

Pico: "The detector we couldn't afford turned out to be one more line in a list."

## A router that lives in a loop

The router needed more than a model swap. In LiveKit, a trick can only start from a tool call or from the agent's `on_enter`. If Decisions picked the trick and a text model then had to call the matching tool, we'd add the second call straight back.

So the lesson became a loop in code inside `on_enter`. It decides, runs the trick, and decides again. This is from `lectern/teacher.py`, trimmed:

```python
async def lesson(self) -> None:
    learner: str | None = None
    while True:
        while not self.inbox.empty():  # turns that arrived during the last trick or decision
            learner = " ".join(filter(None, [learner, self.inbox.get_nowait()]))
        self.allowed_now = allowed(self.state, self.kit, learner_spoke=learner is not None)
        # ... close the lesson when nothing is left
        trick, why = await choose(self.decider, self.situation(learner), self.allowed_now, learner is not None)
        if trick == "listen":  # they paused mid-thought: wait for the rest and decide on the whole of it
            self.log("listen", None, why, "waiting")
            learner = f"{learner} {await self.inbox.get()}"
            continue
        # ... "hold" acknowledges in a few words, then waits
        learner = await getattr(self, trick)(why, learner)
```

Decisions doesn't write a reason, so `why` holds the probabilities instead, such as `explain 0.52, side_question 0.48`. Reading a transcript, you can see how sure the router was at each step.

Without an OpenAI key, or when a call fails, the judge falls back to DeepSeek and the router to a fixed order in code. A lesson never stops because a classifier did.

## The bug that was ours

When we added `hold`, the model picked it correctly, at 0.96 to 1.00 on real requests for a moment. Our `Judgment` schema didn't list it, so every hold was thrown away as `other`, and a lesson deadlocked. Typed outputs make this easy to test for, so a test now checks every intent.

Pico: "The model worked. Our list of allowed answers didn't."

## What stayed out

The spoken words stayed with a text model, DeepSeek Flash or GPT-6 Luna with `--luna`. The lesson rules stayed in code.

We also tried GPT-Live, OpenAI's full-duplex voice model. It was the liveliest voice we heard, but with the lesson left to its instructions it drifted into a quiz. One session note reads "instead of teaching, it is repeatedly asking me the question." It costs about $3 an hour, against an estimated $0.10 to $0.20 for our own teacher.

## Ever since then

In live lessons the judge takes 568 ms at the median, against 1,116 ms on DeepSeek. That's slower than the benchmark because real input is longer, and it's the number the learner hears.

The speed mattered less than what it allowed. At 400 ms we could ask "has the learner finished?" on every turn, and that stopped the tutor grading half-sentences. And the decision model only fit because part 2 had already shrunk the job. A faster model on the old router would have broken the same rules faster.

To try this on your own system:

1. List every model call in your hot path. Mark each as a pick from a list or as text.
2. Take away every option code can decide.
3. Build labelled cases from real sessions, and fix a pass bar before the first run.
4. Measure from where your users are, and reverse the choice order once.
5. Test that every value your schema returns is one your code handles.
