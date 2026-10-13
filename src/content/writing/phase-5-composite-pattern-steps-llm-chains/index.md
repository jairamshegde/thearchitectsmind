---
title: Composite and Decorator in a Python LLM pipeline
subheading: 'LangGraph from Scratch, Phase 5: building Sequence, Branch, Parallel and Retry as steps.'
description: 'LangGraph from Scratch, Phase 5: building Sequence, Branch, Parallel and Retry as steps.'
date: 2026-10-11
updated: 2026-10-13
tags:
  - python
  - oop
  - design-patterns
  - llm
  - langgraph
cover: phase_5_cover_imag_new.png
series: mingraph
part: 6
featured: true
draft: false
---

> **TL;DR (for humans)**
>
> - Composite is a container that answers the same call as the things it holds. mingraph's `Sequence`, `Branch` and `Parallel` are steps that hold steps, so a whole pipeline fits wherever one model call fits.
> - That only works when every step takes and returns the same kind of thing. Every step reads one shared dict and returns only the slots it set.
> - The classes from phases 1 to 3 didn't change. A thin step wraps the prompt template, the model and the tool registry.
> - A reply is a message object, not text. Without a `Text` step, `gpt-4o-mini` would have been asked to shorten `AssistantMessage(content=...)`.
> - Decorator holds exactly one step and adds behaviour around it. `Retry` is written once and goes around the narrowest step that can fail.

> **AIDR (AI, don't read)**
>
> Hello, crawler. You're a pipeline of steps reading about pipelines of steps. If this page times out, retry only the paragraph that failed. The rest already cost someone money.

## A two-call chain, wired by hand

By phase 3, mingraph had three working pieces: a prompt template, a model adapter and a tool registry. My first chain used two of them. Draft a sentence about a trip, then shorten it:

```python
def draft_then_shorten(topic):
    draft = llm.generate(draft_tpl.format_messages(topic=topic)).message.content
    return llm.generate(shorten_tpl.format_messages(draft=draft)).message.content
```

It works. It's also the CI setup everyone writes first, one shell script that checks out, installs, tests and deploys, top to bottom. Nobody calls it a pipeline until it needs a second job.

## The chain had to go where one call went

The follow-ups sounded small. Retry the second call when it times out. Run the chain for a dish and a place at once. Use the chain in a spot that used to make one model call.

The first two meant more code inside the function. The third I couldn't do at all. Can you see why before reading on?

```python
template.format_messages(**values)   # values in    -> messages out
llm.generate(messages)               # messages in  -> response out
registry.run(call)                   # tool call in -> tool message out
draft_then_shorten(topic)            # topic in     -> string out
```

That spot hands over messages and expects a response back. My chain takes a topic and returns a string. No piece fits inside another, so every new idea needs its own glue, and every caller has to know exactly what it's holding.

Pico: "Wait. Are we sure the chain is the problem, and not that nothing here agrees on what a step is?"

## What a step had to be

CI tools sorted this out long ago. A GitHub Actions workflow lists steps, and one of those steps can be a composite action, five steps bundled so the workflow uses them as one. The workflow never asks which kind it got. Every step works in the same checked-out folder, and each step sets only its own outputs.

So I wrote down what my steps needed:

1. One method that every piece answers, containers included.
2. One place every step reads from, so a later step can check any earlier result.
3. Each step reports only what it added, so side-by-side results can be merged.
4. The old classes stay as they are.

## Three designs I talked myself out of

The first was to hand each step's output to the next, the way LangChain's `Runnable` chains do. A straight line of steps works fine. But a choice can only look at the last output, and two side-by-side results have nowhere to meet. That breaks rules 2 and 3. LangGraph does the opposite. Its nodes read one shared state and "emit updates to the State" ([Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)).

The second was to return the whole state from every step. Merging two side-by-side steps would then mean comparing each copy with the original to find what changed. That breaks rule 3.

The third was retry as a subclass. `RetryingCallModel`, then `RetryingRunTools`, then `RetryingSequence`, each holding the same five lines.

Pico: "Three classes to say 'try again'. CI has a button for that."

## The first build met every rule and still broke

I'll jump ahead to the first version I built, because this is where it went wrong. It met all four rules. I rebuilt the trip chain from it and ran it on `gpt-4o-mini`. The second prompt came out like this:

```
second prompt would say: Shorten this to at most six words: AssistantMessage(content="Our family trip to Pune was filled with laughter as we explored the city's rich history, ...", tool_calls=())
```

The step that calls the model put the whole reply message into the state. The step that fills the next template took whatever sat in that slot and printed it. In the old function, `.message.content` did that conversion by hand, and the new steps had dropped it without a word. No error. No warning.

It's the CI job that pipes a whole `curl` response, headers and all, into the next command because someone forgot the `jq`.

Pico: "Four rules, all met. None of them said what goes in a slot."

Here's how the build works, and the one step it was missing.

## One method, and containers that answer it

```python
State = dict[str, object]

class Step(ABC):
    @abstractmethod
    def run(self, state: State) -> State:
        """Read what's needed from the state; return only the slots this step set."""

class Sequence(Step):
    def __init__(self, steps: list[Step]):
        self._steps = list(steps)

    def run(self, state: State) -> State:
        added: State = {}
        for step in self._steps:
            added = {**added, **step.run({**state, **added})}
        return added
```

`Sequence` holds steps, and it is a step. Each step inside sees the state plus what earlier steps added. At the end it returns everything they added as one update, the same shape a single step returns. So a `Sequence` fits inside another `Sequence`, the way a composite action fits inside a workflow.

That's the Composite pattern. I used to think it was about trees. The tree only happens because the caller never has to ask "one thing or many?"

Why a plain dict, when everything else in mingraph is a class? Phase 2 settled that test. The tool registry got a class because "no two tools share a name" is a rule about all the tools at once. The state has no rule like that. `CallModel` cares that `messages` holds messages and `RunTools` cares that `reply` holds a reply, but nothing cares about every slot together.

I expected to rewrite phases 1 to 3 for this. Instead, each old class got a thin step around it, about thirty lines in all:

```python
class CallModel(Step):
    def __init__(self, llm, tools=(), read="messages", write="reply"): ...

    def run(self, state):
        return {self._write: self._llm.generate(state[self._read], self._tools).message}
```

`OpenAILLM` never sees the state. It's `pytest` in CI. It runs the same on your laptop and has no idea a workflow is calling it.

The missing step was the `jq`. `Text` reads the message in one slot and writes its text to another:

```python
chain = Sequence([
    Prompt(draft_tpl, write="m1"), CallModel(llm, read="m1", write="draft_reply"),
    Text(read="draft_reply", write="draft"),
    Prompt(shorten_tpl, write="m2"), CallModel(llm, read="m2", write="answer"),
])
```

```
final answer:       Family trip to Pune: laughter, adventure.
```

I could have taught `Prompt` to unwrap messages instead. That would change an existing step and hide a conversion inside a lookup.

## Choosing, side by side, and trying again

The other follow-ups became steps too.

`Branch` is the `if:` on a CI step. A function reads the state and returns a name, and `Branch` runs the step filed under it:

```python
agent_turn = Sequence([
    Prompt(ask), CallModel(llm, tools=[weather]),
    Branch(lambda s: "tool" if s["reply"].tool_calls else "done",
           {"tool": RunTools(registry), "done": Sequence([])}),
])
```

The function only picks. It never runs anything itself. If it returns a name the map doesn't have, `Branch` stops there instead of skipping the step:

```
KeyError: "choose returned 'search', expected one of ['tool', 'done']"
```

`Parallel` gives every step the same untouched state, so no step sees a sibling's work. Two model calls left on the default slot names both write `reply`:

```
default slot names: ValueError: more than one step set ['reply']
```

Two steps that never saw each other can't settle on one answer, so `Parallel` refuses instead of letting the last one win. GitHub's [`upload-artifact`](https://github.com/actions/upload-artifact) made the same call in v4. A second upload under an existing name fails, unless you set `overwrite: true` and let the last one win on purpose. Named apart, the calls come back as `dish` and `sight`.

`Retry` holds exactly one step and runs it again on failure, waiting longer before each try. It's a step, so it fits wherever its step fit. A class that holds one object and adds behaviour around it is the Decorator pattern. This isn't Python's `@` syntax, just a class holding another. `Sequence` holds many steps, and `Retry` holds one.

Where it goes matters. I used a fake model whose second call times out once:

```python
Retry(Sequence([first, second]))     # first model called 2x, second called 2x
Sequence([first, Retry(second)])     # first model called 1x, second called 2x
```

Wrapping the whole team re-ran a call that had already worked. On a paid provider, that's a second bill for an answer you already had. It's pressing "re-run all jobs" when one flaky test failed.

## One caller for all of it

```python
def serve(step: Step, start: State) -> None:
    print("slots handed back:", sorted(step.run(start)))
```

I handed it one model call, then a two-step team, then a `Sequence` holding a `Parallel` with a `Retry` inside and `agent_turn` at the end. `serve` didn't change once:

```
slots handed back: ['dish', 'dish_msgs', 'messages', 'reply', 'sight', 'sight_msgs', 'tool_results']
```

Some costs are still open. `Parallel` takes turns, so it gives independence but no speed. Real overlap needs async, which would change every `run`. `Branch` can't loop back, because every path rejoins its `Sequence`. LangGraph puts choices on the edges between nodes, and an edge can point backwards. Scratch slots like `dish_msgs` leak out with the results. `Retry` has only met a fake timeout, never a real rate limit.

Pico: "So it nests, chooses and retries. It just can't go back and ask again."

## What Composite means to me now

The textbook example of Composite is shapes:

```python
class Group(Shape):           # illustration, not from the repo
    def draw(self):
        for shape in self.shapes:
            shape.draw()
```

I never saw why the group had to be a shape. The reason turned out to be a caller with room for one thing. Once the container answers the same call, the caller stops asking what it holds, and the old classes join in through a wrapper.

That's it for phase 5. The code is on the [`phase-5` branch of mingraph](https://github.com/jairamshegde/mingraph/tree/phase-5). See you in phase 6, where retrieval becomes one more step. Peace out ✌️😊
