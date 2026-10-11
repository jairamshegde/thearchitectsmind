---
title: The Composite Pattern in a Python LLM Pipeline
subheading: 'LangGraph from Scratch, Phase 5: building Sequence, Branch, Parallel and Retry as steps.'
description: 'LangGraph from Scratch, Phase 5: building Sequence, Branch, Parallel and Retry as steps.'
date: 2026-10-11
tags:
  - python
  - oop
  - design-patterns
  - llm
  - langgraph
cover: phase_5_cover_image.png
featured: true
draft: false
---

> **In a hurry?**
> 
> *   **Composite** is a container that answers the same call as the things it holds. Calling code can't tell one step from a whole pipeline, and doesn't need to.
>     
> *   That only works if every step takes and returns the same kind of thing. In mingraph, every step reads one shared dict and returns only the keys it set.
>     
> *   The classes from earlier phases didn't change. A thin step wraps the prompt template, the model and the tool registry.
>     
> *   **Decorator** holds exactly one step and adds something around it, here "try again". Retry gets written once instead of once per kind of step.
>     

## The tutorial version

The Gang of Four book defines Composite like this:

> Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.

Tutorials usually show it with shapes:

```python
class Circle:
    def draw(self): print("circle")

class Group:
    def __init__(self, shapes): self.shapes = shapes
    def draw(self):
        for shape in self.shapes:
            shape.draw()
```

A `Group` holds shapes and also has `draw()`, so a group can sit inside another group. I could recite that for years without it meaning anything. It looked like a list with a loop, and I didn't see why `Group` needed to *be* a shape. I can loop over a list myself.

The missing piece was a reason to put a group where a single shape was expected. I'd never needed that until phase 5.

## A chain of two model calls

Most LLM code I've written looks something like this. Draft a sentence about a trip, then shorten it:

```python
def draft_then_shorten(topic):
    draft = llm.generate(draft_template.format_messages(topic=topic)).message.content
    return llm.generate(shorten_template.format_messages(draft=draft)).message.content
```

The first call writes a draft and the second one shortens it. It works, and for a while it was all I needed.

The picture I'll keep coming back to is a dal tadka recipe:

1.  Cook the dal.
    
2.  Make the tadka.
    
3.  Pour the tadka over the dal.
    

Step 2 is a small recipe of its own: heat ghee, add jeera, then garlic and a red chilli. On the card it still sits as one line, and whoever is cooking reads "do step 2" and does it.

`draft_then_shorten` is a recipe as well, with each line as a step. I'm the only cook, and bits like `.message.content` are me carrying food between counters by hand.

## Three small requests I couldn't meet

The trouble started with follow-ups that sounded small.

The first was to retry the second call when it times out. That put a loop inside the function:

```python
def draft_then_shorten(topic):
    draft = llm.generate(draft_template.format_messages(topic=topic)).message.content
    for attempt in range(3):
        try:
            return llm.generate(shorten_template.format_messages(draft=draft)).message.content
        except TimeoutError:
            if attempt == 2:
                raise
```

The second was to run the chain for a dish and a place at the same time, which meant writing another function. The third was to use the chain where the code used to make a single model call. That one I couldn't do at all. See if you can spot why before reading on.

The old spot called `llm.generate(messages)` and expected a response object back. My chain takes a topic and returns a string. The pieces underneath don't match each other either:

```python
template.format_messages(**values)   # values in   -> messages out
llm.generate(messages)               # messages in -> response out
registry.run(call)                   # one call in -> one tool message out
```

None of them fits inside another. Every new idea, whether retrying one call, running two together or nesting one chain in another, needed its own glue. And the caller had to know exactly what it was holding.

So I wanted two things: one method that every piece answers, and containers that answer that same method. Then step 2 could be one action or a whole recipe, and the cook wouldn't have to care.

## One method for every piece

I started with a base class that has a single method:

```python
class Step(ABC):
    @abstractmethod
    def run(self, state: State) -> State:
        """Read what's needed from the state; return only the slots this step set."""
```

`ABC` and `@abstractmethod` stop Python from creating any `Step` subclass that doesn't define `run`. That's the "promise" from phase 1. The `state` argument gets its own section next, since I wrote the word before deciding what it meant.

The first container runs its steps in order:

```python
class Sequence(Step):
    def __init__(self, steps: list[Step]):
        self._steps = list(steps)

    def run(self, state: State) -> State:
        added: State = {}
        for step in self._steps:
            added = {**added, **step.run({**state, **added})}
        return added
```

`{**a, **b}` builds a new dict from `a` with `b` laid on top. So each step sees the incoming state plus whatever earlier steps added.

The first line, `class Sequence(Step)`, bothered me. Phase 2 left me with a rule: holding something doesn't make you that thing. A list of messages isn't a message. Yet `Sequence` holds steps and is declared as a step. Had I broken my own rule?

Not quite. The rule still stands, because holding steps isn't what makes `Sequence` a step. It's a step because I gave it `run(state)` on purpose, so it can go anywhere a step is expected.

To test that, I wrote one caller and gave it three different things: a single model call, a sequence of two steps, and a tree three levels deep.

```python
def serve(step: Step, start: State) -> None:
    added = step.run(start)
    print("  slots handed back:", sorted(added))

serve(CallModel(llm), start)
serve(Sequence([Prompt(ask), CallModel(llm)]), start)
serve(Sequence([Parallel([dish, sight]), Sequence([Prompt(ask), CallModel(llm, write="hello")])]), start)
```

`Prompt`, `CallModel` and `Parallel` are explained further down. All that matters for now is that each of them is a `Step`. The model is an offline fake, so the output is exact:

```plaintext
slots handed back: ['reply']
slots handed back: ['messages', 'reply']
slots handed back: ['dish', 'dish_msgs', 'hello', 'messages', 'sight', 'sight_msgs']
```

`serve` stayed the same for all three. The cook reads "do step 2" whether step 2 is one action or a recipe with another recipe inside.

That's the Composite pattern. The container answers the same call as the things it holds, so from outside, one step and a deep tree look identical. It also answers my old question about the tutorial: `Group` is a shape so that it can go where a shape is expected.

## Deciding what a step reads

I still hadn't decided what `state` was, and the two libraries I was learning from disagree.

LangChain's `Runnable` passes things along. In a sequence, "one Runnable's output serv\[es\] as the next's input" ([Runnable reference](https://reference.langchain.com/python/langchain-core/runnables/base/Runnable)). LangGraph keeps one shared state with named slots, and "nodes will emit updates to the State" ([Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)).

On the stove, that's the difference between handing a fresh bowl to the next person at every step and keeping one pot on the burner that everyone reaches into.

I had three containers planned: `Sequence`, a `Branch` that picks one step to run, and a `Parallel` that runs several side by side. One of them works with bowl-passing and two don't. Which one?

`Sequence` works either way. `Branch` has to look at something to decide, and with bowl-passing all it can see is whatever the last step made. `Parallel` gets two bowls back at once and has nowhere to combine them. A rule like "if the dal is too thick, add water" needs a pot to look into.

So the state became one plain dict that every step shares:

```python
state = {"question": "What's the weather in Pune?", "messages": [...]}
```

With a pot in place, `Branch` is short. It takes a function that looks in the pot and returns a name, plus a map from names to steps:

```python
def check(state):
    return "tool" if state["reply"].tool_calls else "done"

agent_turn = Sequence([
    Prompt(ask),
    CallModel(llm, tools=registry.tools),
    Branch(check, {"tool": RunTools(registry), "done": Sequence([])}),
])
```

`tool_calls` is the list of tools the model asked to run, so `check` picks "tool" when that list isn't empty. With the fake model, a weather question ended with `tool_results: ['31°C, humid in Pune']`, and a food question ended with an empty list. The "done" path is an empty `Sequence`, a recipe with no steps.

Sharing one pot has a price. All steps share one set of slot names, so a typo such as `"mesages"` only shows up at run time, as a `KeyError`. LangGraph lets you declare the state as a `TypedDict`, a dict whose keys an editor can check. I'll switch if a typo ever costs me a real bug.

## Deciding what a step returns

The roadmap wrote the method as `run(state) -> state`: take the pot, return the pot. In a straight line that's fine. With two cooks working side by side, it breaks.

Picture two model calls inside a `Parallel`, one writing a `dish` answer and the other a `sight` answer. If each returns the whole pot, there are now two pots. One has `dish` and no `sight`, the other has `sight` and no `dish`. Neither is the real pot.

Instead, each step returns a katori, a small bowl labelled with the slot its contents belong in, and the container pours every katori into the one pot. In code, a katori is a small dict holding only the slots that step set. `Prompt.run` reads `question` and returns one slot, `messages`:

```python
def run(self, state):
    values = {name: state[name] for name in self._template.variables}
    return {self._write: self._template.format_messages(**values)}
```

The same reasoning applies one level up. When a whole `Sequence` runs as a step inside a bigger one, it has to return a single katori with everything it added, because that's what a single step returns. If containers returned whole pots and steps returned katoris, the outer container would have to check "one step or many?" before using the result. Composite exists so that check is never needed. That's also why `question` was missing from the `serve` output earlier. The caller gets back what was made, not what it passed in.

Katoris also make one problem easy to spot. Put two `CallModel` steps side by side with default settings, and both return a katori labelled `reply`. Pouring one after the other would quietly throw away the first answer. Neither call saw the other's work, so there's no fair way to pick a winner, and `Parallel` raises an error instead:

```plaintext
default slot names: ValueError: more than one step set ['reply']
named apart: {'dish': '(reply to: Name one dish to try in Pune.)', 'sight': '(reply to: Name one place to visit in Pune.)'}
```

LangGraph refuses as well. Two parallel nodes writing one key raise `INVALID_CONCURRENT_GRAPH_UPDATE`, because "the graph cannot determine which value should take precedence" ([error reference](https://docs.langchain.com/oss/python/langgraph/errors/INVALID_CONCURRENT_GRAPH_UPDATE)).

All of this was about the outside of a step. Inside sat the classes from earlier phases, and none of them knew a pot existed.

## Fitting the classes from earlier phases

`format_messages`, `generate` and `registry.run` came from three earlier phases, and I was worried I'd have to reopen all of them.

That didn't happen. Each class gets a thin step around it. The step reads what it needs from a slot, calls the old class exactly as before, and returns a katori:

```python
class CallModel(Step):
    def __init__(self, llm, tools=(), read="messages", write="reply"):
        ...
    def run(self, state):
        return {self._write: self._llm.generate(state[self._read], self._tools).message}
```

(The `...` stores the four arguments. Full class in [steps.py](https://github.com/jairamshegde/mingraph/blob/phase-5/mingraph/steps.py).)

The model class never learns about the pot. Slot names are constructor arguments with the usual names as defaults, which is how `dish` and `sight` were kept apart above.

Then I rebuilt draft-then-shorten from steps. The second template has a `{draft}` slot, filled from the first call's `reply`. I assumed the second prompt would contain the drafted sentence. With a real first reply from `gpt-4o-mini`, it contained this:

```plaintext
Shorten this to at most six words: AssistantMessage(content='Our family trip to Pune was filled with delightful visits to historical sites, vibrant markets, and indulging in delicious local cuisine that brought us closer together.', tool_calls=())
```

That's the whole reply object, printed as text. In `draft_then_shorten` I'd been typing `.message.content` by hand, and in the step version nothing did that job. The template fills its slots with Python's `str.format`, which prints whatever object it's given.

So that bit of hand-carrying became a step too:

```python
class Text(Step):
    def run(self, state):
        return {self._write: state[self._read].content}
```

(Constructor left out. It stores `read` and `write`, with `"reply"` and `"text"` as defaults.)

The chain is now prompt, model, `Text`, prompt, model. Run live, it ended with:

```plaintext
final answer: Pune trip: laughter, adventure, culture.
```

With every piece of glue turned into a step, I could go back to the first request: retry the second call.

## Should retry be a subclass?

My first idea was inheritance: `RetryingCallModel(CallModel)`, with a loop inside `run`. That covers model calls. Tools would then need `RetryingRunTools`, and sequences would need `RetryingSequence`, each one a copy of the same five lines.

Back in the kitchen, that's teaching every cook the same rule one at a time. A supervisor works better. They stand next to any one cook, say "go ahead", and if it goes wrong, "go again". The cook never knows they're there.

In code, the supervisor is a step that holds exactly one step:

```python
class Retry(Step):
    def run(self, state):
        for attempt in range(1, self._attempts + 1):
            try:
                return self._step.run(state)
            except self._on:
                if attempt == self._attempts:
                    raise
                time.sleep(self._wait * (2 ** (attempt - 1) + random.uniform(0, 1)))
```

(Constructor left out. It takes the `step`, `attempts=3`, `on=(Exception,)` and `wait=1.0`.)

The wait doubles on each try, plus a random extra so that many clients failing at once don't all retry at the same moment. `on` lists which errors deserve another try, so a slot-name typo can fail immediately instead of three times.

This is the Decorator pattern: an object that holds one object with the same interface and adds behaviour around it. It shares a name with Python's `@decorator` syntax, but it isn't that. There's no `@` here, just a class that holds another object. The only difference from Composite is the count: a `Sequence` holds many steps, and a `Retry` holds one.

Where the `Retry` goes turned out to matter. I used a fake model whose second call times out once and tried two placements. One of them pays for a call twice. Can you tell which?

| Where the `Retry` went | First model called | Second model called |
| --- | --- | --- |
| Around the whole two-call `Sequence` | 2 times | 2 times |
| Around only the flaky call, inside the `Sequence` | 1 time | 2 times |

Wrapping the whole sequence re-ran the first call even though it had already succeeded. Against a paid provider, that's a second bill for an answer you already had. Wrapping only the flaky step avoided it, and that option exists only because the supervisor fits anywhere a step fits.

## Running everything from one caller

`serve` hasn't changed since I first wrote it:

```python
def serve(step: Step, start: State) -> None:
    added = step.run(start)
    print("  slots handed back:", sorted(added))
```

The biggest thing I gave it runs two questions side by side, with a `Retry` around the first one's flaky model. Then it finishes with the agent turn and its `Branch`:

```python
flaky_dish = Sequence([Prompt(ask_dish, write="dish_msgs"),
                       Retry(CallModel(FakeLLM(fail_first=1), read="dish_msgs", write="dish"), wait=0)])
trip = Sequence([Parallel([flaky_dish, sight]), agent_turn])
serve(trip, {**start, "question": "What's the weather in Pune?"})
```

```plaintext
slots handed back: ['dish', 'dish_msgs', 'messages', 'reply', 'sight', 'sight_msgs', 'tool_results']
```

`serve` can't tell that it's holding a `Sequence` with a `Parallel` inside, a `Retry` inside that, and a `Branch` at the end. Each part of this post shows up in that one output:

*   `Step` is the single method, so `serve` never asks what it's holding. `Sequence(Step)` is Composite.
    
*   `start` is the pot. `added` is the katori, which is why `question` isn't in the list.
    
*   `CallModel`, `Prompt` and `RunTools` are thin steps around old classes that never saw the pot.
    
*   `Parallel` would have refused if `dish` and `sight` were both called `reply`.
    
*   `Retry` sits next to one model call and leaves the `sight` call alone. That's Decorator.
    

Back to the shapes, then. The tutorial had `Circle`, `Group` and `draw()`, but no caller that wanted a group in a spot built for one circle. In mingraph, that caller was the problem I started with.

| What the tutorial says | What phase 5 showed me |
| --- | --- |
| "Treat individual objects and compositions uniformly." | The container answers the same call *and returns the same kind of thing*. A sequence returns one katori, like a single step. |
| "A `Group` holds shapes." | Holding doesn't make you a step. `Sequence` is a step because I gave it `run` on purpose. |
| Tree structures. | Nesting follows once containers are steps. What matters is that the caller never asks "one thing or many?" |
| (Not in the tutorial.) | A wrapper that holds one step (Decorator) is the other half. It's why retry is written once. |

## Open questions and phase 6

Some of this isn't verified yet, and some isn't built:

*   `Parallel` takes turns. Each step gets the untouched pot, so the result matches truly side by side, but it isn't faster. On `gpt-4o-mini`, two calls took about the sum of their times whenever I measured. Running them at once would mean async, which changes every `run` and every adapter, so it's in the backlog.
    
*   `Branch` can't loop back, because every path rejoins the `Sequence`. LangGraph puts the choice on the arrows *between* boxes (`add_conditional_edges`), and an arrow can point backwards. That's the agent loop, and it belongs to the capstone.
    
*   Working slots leak. `messages`, `dish_msgs` and `sight_msgs` came out of `serve`, though none of them is a result. Two sequences that both use the default `"messages"` would clash inside `Parallel`. Naming slots by hand has been enough so far.
    

Every step so far wraps something I already had: a template, a model, a tool. None of them brings in facts the model doesn't know. Phase 6 is retrieval: a retriever that works with any vector store and any embedding model without the calling code noticing. Once it's a step, it can sit in front of a prompt like any other cook.

*   Code: [mingraph, phase 5 branch](https://github.com/jairamshegde/mingraph/tree/phase-5)
    
*   [LangGraph: Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
    
*   [LangChain: Runnable reference](https://reference.langchain.com/python/langchain-core/runnables/base/Runnable)
    
*   [LangGraph: INVALID\_CONCURRENT\_GRAPH\_UPDATE](https://docs.langchain.com/oss/python/langgraph/errors/INVALID_CONCURRENT_GRAPH_UPDATE)
    

Thank you for reading 🙂 see you in the next phase, bye ✌️
