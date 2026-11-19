---
title: 'System 1 without the hype :  Our voice tutor graded half-sentences'
description: Our voice tutor kept cutting learners off mid-thought and grading the fragments as wrong answers. Looking for a fix, we found that four of its five per-turn jobs were multiple-choice questions being answered by a model that writes text.
date: 2026-11-19
tags:
  - jev
  - system-1
  - decisions-api
  - multi-agent
  - LLM
  - tutor
series: system-one
part: 1
featured: true
draft: true
---

# Our voice tutor graded half-sentences

*System 1 without the hype, part 1 of 4*

Lectern is a voice tutor we built to teach Python concepts out loud. It runs locally on an M1 Pro inside LiveKit Agents. Silero VAD hears that the learner is talking, Parakeet turns the speech into text, DeepSeek Flash does the thinking, and Kokoro-82M speaks the reply.

Every time the learner stops speaking, Lectern runs a short chain. It works out what the learner just did: answered, asked something, said "go on", made an "mm-hm", or paused mid-thought. If they answered, it judges how right the answer was. Then it picks the next teaching move, writes a few spoken sentences, and says them.

We tested all of this by ear. We sat through lesson after lesson, and each transcript became the evidence for the next fix.

## One thought, six replies

The learner in these sessions thinks aloud, with pauses. Lectern treated every pause as the end of a turn.

Here is one fragment from a lesson on closures:

> "So if we pass two as a value, then we will get back."

That is half a sentence. Lectern judged it as a wrong answer, replied to it, and charged the learner one attempt. In another session one explanation was restarted six times, because each pause produced a reply that cut the learner off.

The second cost was silence. The judge took 1.0 to 1.4 s to classify a learner turn, and choosing the next teaching move was another model call of about a second. One session note reads "due to thinking there is a slight delay which is already understood". Understood, and still about two seconds of dead air every time the learner spoke.

Pico: "So the tutor's two problems are that it doesn't wait, and then it makes you wait."

A fix had to do two things. It had to tell "finished" from "still thinking" on every turn, and it couldn't add delay to a chain that was already too slow.

## The detector that was already running

The obvious suspect was turn detection. LiveKit has a semantic turn detector that waits until the user finishes an idea, so we went to switch it on.

It was already on. The log showed that LiveKit had started its local `turn-detector-v1-mini` by itself. When the learner stops, it estimates the probability that they've finished. At 0.36 or more it ends the turn after 0.5 s of silence. Below that, it waits up to 3 s.

Pico: "Wait. We were about to switch on a feature that was already running?"

So why were thoughts still being cut? Either the detector called a pause finished, and 0.36 is an easy bar to clear, or the learner paused for longer than 3 s while thinking. We couldn't tell which. The log doesn't record the probability or the wait for each turn.

That ruled out the cheap fix. Every option left had a cost:

- LiveKit's cloud `turn-detector-v1` is stronger. It needs a LiveKit Cloud account and sends the learner's audio to LiveKit.
- LiveKit's text-only `EnglishModel` takes tens of milliseconds. It sees only words, not tone, and LiveKit has deprecated it.
- A custom detector on DeepSeek would know which question the learner was answering. At 0.8 to 1.4 s per call, run at every pause, it would add about a second to every reply.

The last option was the one we wanted, and the one we couldn't afford. We needed a model call fast enough to ask "has the learner finished?" on every turn, and we didn't have one.

## What each call returns

Stuck there, we wrote down every job in the live turn and what each one hands back:

| Job | Output |
|---|---|
| What did the learner do? | One of answer, question, confused, go on, backchannel, still thinking, hold |
| How right is the answer? | Right, partial or wrong, plus which known mistake |
| Which teaching move fits now? | One of the moves code already allows |
| Has the learner finished their thought? | Yes or no |
| What to say | A few spoken sentences |

Four of the five jobs pick from a list that code already knows. Only the last one needs written text. Yet we were sending all five to a model that writes text, and waiting while it wrote out the name of a choice.

The fourth row is the one we couldn't afford at every pause. Before we could make these picks faster, we had to make one of them smaller. Part 2 covers the eval that taught us how.

Pico: "Four multiple-choice questions, answered in essay form. No wonder it was slow."
