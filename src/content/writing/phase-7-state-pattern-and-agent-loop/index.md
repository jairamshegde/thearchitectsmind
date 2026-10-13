---
title: The State and Observer Patterns in a Python Agent Loop
subheading: 'LangGraph from Scratch, Phase 7: a loop that calls the model and runs tools until it answers, and a way to watch it run.'
description: 'LangGraph from Scratch, Phase 7: a loop that calls the model and runs tools until it answers, and a way to watch it run.'
date: 2026-10-11
tags:
  - ai-agents
  - python
  - oop
  - design-patterns
  - LLM
cover: phase_7_cover_image.png
series: mingraph
part: 7
featured: true
draft: false
---

> **In a hurry?**
> 
> *   An **agent** is a model calling tools in a loop. The model decides how many rounds there are. Your code only decides the ceiling.
>     
> *   The **State pattern** gives each situation the loop can be in its own object. Each object does its situation's work and hands back the object for the next situation. Nothing in the loop asks "where am I?", because the object you're holding already is the answer.
>     
> *   The **Observer pattern** lets the loop announce what just happened to whoever signed up, without knowing who they are. Logging, tests and trace files plug in, and the loop doesn't change. With nobody listening, it runs exactly the same.
>     
> *   Watching turned out to matter more than I expected. A model's mistake may never happen twice, so the trace has to be recording before you know there's a bug.
>     

## The textbook version of both ideas

You've probably read these definitions. From the Gang of Four book:

*   **State:** "Allow an object to alter its behavior when its internal state changes. The object will appear to change its class."
    
*   **Observer:** "Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically."
    

The tutorials pair State with a traffic light or a vending machine. Red, green, yellow, each a class with a `next()` method. Observer gets a newsletter: subscribers sign up, the publisher sends, everyone gets a copy.

I did those tutorials. Neither stuck. A traffic light has three colours and one rule each. An `if` handles that in four lines, so why would anyone write three classes? And Observer looked like a list of functions with a fancy name.

Both ideas finally made sense when I built something that needed them: an agent loop.

## How you probably write an agent today

If you've written an agent by hand, it probably looks something like this:

```python
# illustration: the loop most of us write first
messages = [system, user]
while True:
    reply = client.chat(messages, tools=tools)
    messages.append(reply)
    if not reply.tool_calls:
        break
    for call in reply.tool_calls:
        print("calling", call.name)
        messages.append(run_tool(call))
```

It works. I'll keep coming back to one picture from phase 3 to explain why it's shaped this way.

The model is a manager on a phone call. They can't reach any files. Before the call you hand them a menu of errands you can run. During the call they either answer, or pass you a slip: "run `get_weather`, city = Paris". Each slip has a ticket number, which providers call the tool call id. You run the errand and pass back an answer slip with the same ticket number.

The manager also forgets everything between calls. So each time, you read them the whole conversation from the top. That's the `messages` list. In this picture, `client.chat(...)` is reading the folder out loud, `reply.tool_calls` are the slips, and the `for` loop is you running errands.

Up to phase 6, mingraph had all the parts. What it didn't have was the `while True`.

## The question that needed more slips than I'd planned for

Phase 5 had turned the model call and the tool run into steps, `CallModel` and `RunTools`, that sit in a `Sequence`. So my first idea was to build the agent out of those:

```python
# illustration: my first instinct
Sequence([CallModel(...), RunTools(...), CallModel(...)])
```

That's the phase 3 round trip. Ask, run one tool, ask again, get the answer. Two model calls.

Then I gave it a real question, with two tools on the menu, `get_weather` (returns Celsius) and `to_fahrenheit`: "What's the temperature in Paris and in Tokyo, in Fahrenheit?"

How many model calls do you think that takes?

`gpt-5-mini` needed four (from an earlier session's console log):

```plaintext
[step 1]  reply: (asks for get_weather, get_weather)
[step 2]  reply: (asks for to_fahrenheit)
[step 3]  reply: (asks for to_fahrenheit)
[step 4]  reply: 'Paris: 64°F, Tokyo: 75°F'
```

`qwen3.5:2b` needed three, because it asked for both conversions in one reply. Same tools, same question, a different number of rounds.

So who decides how many `CallModel`s go in the list? The model does. It reads each answer slip and only then decides whether it needs another errand. A list only goes forward. It can't draw the arrow from "run the tools" back to "call the model".

I needed a loop where the current situation decides what happens next, and a way to see what that loop was doing without the loop knowing who was looking.

## So I wrote the loop, and had to decide who holds the folder

Stripped down, the loop is short:

```python
# illustration: the shape before it was split up
memory.add(UserMessage(question))
for step in range(1, max_steps + 1):
    response = llm.generate(memory.messages(), registry.tools)
    memory.add(response.message)
    if not response.message.tool_calls:
        return response.message.content          # no slips: that's the answer
    for call in response.message.tool_calls:
        memory.add(registry.run(call))
raise StepLimitReached(f"no answer after {max_steps} model calls")
```

Two things in it were choices.

The first is `max_steps`. Every model call is a paid call, and a manager who keeps asking forever is the one mistake worth guarding against up front. So the limit counts model calls, and ten is the default.

The second is `memory`. My first sketch kept a plain list inside the loop and appended to it. Then I asked myself who actually reads the folder out. It's our code, not the model. And phase 4 had already built the thing whose whole job is deciding what gets read out: `Memory`, with `KeepAll`, `LastN` and `Summarise` behind one interface. A plain list in the loop was doing memory's job badly.

So the agent is handed a memory. Swapping `KeepAll()` for `Summarise(...)` changes what the model sees and touches no loop code. It's the same injection as phase 6's vector store being handed its embedder.

That left a default. If the caller doesn't pass a memory, use `KeepAll`. The obvious way to write it:

```python
# illustration: the trap
def __init__(self, llm, registry, system_prompt, memory=KeepAll(...)):
```

When does `KeepAll(...)` in that line run? Once per agent?

It runs once, when Python reads the `def` line. A default argument is built a single time, and every call that leaves it out gets that same object. For `None` or a tuple that's harmless, because they can't change. A `Memory` changes on every `add`. So every agent built without a memory would share one folder, and agent B would read agent A's conversation to its manager.

The fix is to default to `None` and build a fresh folder inside the constructor. That's also the only place this agent's `system_prompt` exists yet, so it's the only place the folder could be built correctly anyway.

The loop worked. But the roadmap asked me to split it into separate objects for its situations, and at first I didn't see why.

## Three situations, and a rulebook that kept asking which one

At any moment on the call, you're in exactly one situation. You're waiting on the manager, or running the errands they asked for, or you've hung up. What you're allowed to do depends on which. Errands only run in the second. After hanging up, nothing should happen.

The obvious way to track that is a sticky note on your desk saying which situation you're in, plus one long rulebook where every rule starts with "what does the note say?":

```python
# illustration: the sticky-note version
while situation != "hung up":
    if situation == "waiting":
        ...  # call the model, then set situation to "errands" or "hung up"
    elif situation == "errands":
        ...  # run tools, then set situation back to "waiting"
```

Every rule for every situation lives in one place. Adding a situation, say "ask a human before running an errand", means editing that block and every check in it.

The State way tears the rulebook into pages, one card per situation. The rules don't disappear. They move onto their situation's card. The "waiting" card ends with: "if they passed slips, pick up *errands*; if they answered, pick up *hung up*." What disappears is the checking. The card in your hand already says where you are.

Your only habit is: do what the card says, then pick up the card it points to. In mingraph's `Agent`, that's the whole `run` loop:

```python
card = _CallingModel(step=1)
while card is not None:
    last, card = card, card.run(self)   # do what the card says; it hands back the next one
```

Each card is a small class with one `run` method. Here's the waiting card:

```python
class _CallingModel:
    def run(self, agent):
        if self.step > agent._max_steps:
            return _Finished(None, "step limit")
        response = agent._llm.generate(agent._memory.messages(), agent._registry.tools)
        agent._memory.add(response.message)
        if response.message.tool_calls:
            return _RunningTools(response.message, self.step)
        return _Finished(response.message.content, "answered")
```

(Trimmed from [`agents.py`](https://github.com/jairamshegde/mingraph/blob/phase-7/mingraph/agents.py); the full version also announces what it did, which comes later.)

`_RunningTools` runs each slip and returns `_CallingModel(step + 1)`. `_Finished` returns `None`, which ends the loop. Each card also carries its own data, like the step number, so there's no shared "current step" variable for three places to keep in sync.

This is the **State pattern**. When an object behaves differently depending on its situation, each situation gets its own object, and each object picks the next one.

It looks a lot like phase 3's errand cards, which were Strategy. Both are "objects with the same method, swapped in and out". The difference is who does the swapping. With Strategy, you pick the card based on the slip in your hand. With State, each card picks the next card.

## I had two things called state on my desk

Once the cards worked, I tried to sum the pattern up in one line: "a logbook that runs from start to end, which each stage can read and write."

That's wrong. It's a good description of something, just not of the State pattern.

Look at the desk again. There's the folder, holding the whole conversation. It only grows, and every situation reads from it and writes to it. It answers "what has happened so far?" Then there's the card in your hand. It records nothing. It answers "what situation am I in, so what do I do now?"

I ran the phone call with no model at all, just a scripted manager that asks twice and then answers, and printed both side by side:

```plaintext
holding: Waiting  | folder has 0 lines
holding: Errands  | folder has 1 lines
holding: Waiting  | folder has 2 lines
holding: Errands  | folder has 3 lines
holding: Waiting  | folder has 4 lines
holding: HungUp   | folder has 5 lines
```

The left column flips back and forth. The right column only climbs.

Two different things sharing the name "state" trips people up, and getting confused by it isn't a sign you missed something. In mingraph's own `steps.py`, the shared dict that every step reads and writes is literally declared as `State = dict[str, object]`. LangGraph calls its shared dict state too. "State" in graphs means what you've got. "State" in the pattern means where you are.

|  | The folder | The cards |
| --- | --- | --- |
| In mingraph's agent | `Memory` | `_CallingModel`, `_RunningTools`, `_Finished` |
| Answers | What has happened? | What do I do now, and what's next? |
| Changes | On every message, only grows | When something happens, flips back and forth |
| In LangGraph | `AgentState`, with its `messages` slot | Which node the graph is in |

That last row made me check something before building further. Does LangChain use the State pattern for its agent? It doesn't. In v1, `create_agent` builds a LangGraph graph with a `model` node, a `tools` node and conditional edges between them. Same three situations, but the "what comes next" is written on the arrows, not inside the boxes. So the cards are a deliberate learning choice on a problem that fits them, not what the framework does. The capstone builds the arrows version.

So far every card had only met the happy path, where the manager eventually answers and every errand works.

## When the call doesn't go to plan

Two things can go wrong, and each needed a decision.

**The manager never stops asking.** We hit `max_steps` with no final reply. But the agent is a `Step`, and a step is supposed to return `{"answer": ...}`. Should I fill the slot with "Stopped: reached the limit"?

I almost did. Then I thought about who reads that slot next. Another step, or later a main agent reading a subagent's reply, can't tell "Paris is 18°C" from "I gave up" without parsing the words. A note in the answer slot is a fake answer. So `_Finished` raises `StepLimitReached` when there's no answer. LangChain offers both behaviours on its call-limit middleware, and LangGraph's own recursion limit raises.

**An errand fails.** My first question was whether errors should go back to the model. I split them in two instead, by asking who can fix each one.

Sometimes the slip is filled in badly: a number where a city should be, or a tool that isn't on the menu. The manager can fix that if you tell them what was wrong. Other times the slip is fine, but the weather service is down. A corrected slip won't bring it back.

mingraph couldn't tell those apart yet. A bad argument raised `TypeError`, but so does a bug inside a tool. So the model's mistakes got their own exception, `ToolArgsError`, and the running card treats the two kinds differently:

```python
try:
    result = agent._registry.run(call)
except ToolArgsError as e:      # the model's mistake: answer the slip with the error, let it retry
    agent._memory.add(ToolMessage(f"Error: {e}\n Please fix your mistakes.", tool_call_id=call.id))
    continue
except Exception as e:          # not the model's to fix: answer the slip anyway, then stop
    agent._memory.add(ToolMessage(f"Error: tool failed: {e}", tool_call_id=call.id))
    raise
```

(Trimmed from `_RunningTools` in `agents.py`.) The error message wording is LangGraph's own `ToolNode` default, which sorts errors the same way.

The second `memory.add` came out of writing the tests. The folder outlives a single run, and providers reject a conversation where a slip has no answer slip. Without that line, a failed run would break the *next* run on the same agent. An error path has to keep the same promises as the happy path.

The agent's offline tests passed, with a scripted model standing in for the real one. Now I wanted to watch a real run. My first thought was a `print` in each card.

## Every card wanted to tell someone something

A `print` would do for me at the terminal. But the tests wanted the exact order of events, as data, not text. A cost tracker would only want token counts. Later I'd want a file.

Each of those, written into the cards, means the cards know about all of them. Every new one edits the agent. And none of them should ever change how the agent runs.

The picture that made this click for me wasn't the phone call. It was a railway station. The announcer says "Train 12627 is arriving on platform 3." They don't know who's on the platform or how many. A passenger picks up their bags, a tea seller heads for platform 3, a porter gets ready. If the platform is empty, the announcement still goes out and the train still arrives on time. And nobody can change the train's schedule by hearing it.

The loop is the announcer. "Model replied" is an announcement. The logger and the test's recorder are people on the platform.

I tried it first on the scripted phone call, with two listeners and then none:

```plaintext
  [supervisor] errand done: convert 18C to F
  [supervisor] manager replied: It's 64F in Paris.
  [supervisor] call over: final answer
  [accounts] errands run: 2

--- empty platform ---
  (nothing printed: nobody was listening)

same folder both times: True
```

This is the **Observer pattern**. The subject announces events to whoever signed up, and knows nothing about who they are or what they do with it.

The experiment's listeners had one method, `hear(event, detail)`, and each one sorted the announcements with its own `if event == ...`. Does that look familiar? It's the sticky note again, coming back inside every listener. So the real `Observer` has one method per announcement, and each does nothing unless you override it:

```python
class Observer:
    def on_step_start(self, step: int) -> None: ...
    def on_model_reply(self, response: LLMResponse) -> None: ...
    def on_tool_call(self, call: ToolCall) -> None: ...
    def on_tool_return(self, result: ToolMessage) -> None: ...
    def on_tool_error(self, call: ToolCall, error: Exception) -> None: ...
    def on_finish(self, answer: str | None, reason: str) -> None: ...
```

A listener that only cares about tool results writes `on_tool_return` and nothing else. When "tool failed" got added late in the design, no existing listener had to change. LangChain's `BaseCallbackHandler` has the same one-method-per-moment shape.

Listeners are handed in through the constructor and copied into a tuple, which can't be changed afterwards. Then there's one more rule. Listeners are someone else's code, and code has bugs. If a listener raises, Python would carry that exception up through the card and kill the run. A listener that can crash the run is a listener that can change it. So the agent calls each one inside a `try`:

```python
def _announce(self, event: str, *args) -> None:
    for observer in self._observers:
        try:
            getattr(observer, event)(*args)    # e.g. observer.on_model_reply(response)
        except Exception:
            logger.warning("observer %s failed on %s", type(observer).__name__, event, exc_info=True)
```

A passenger trips on the platform, and the train doesn't stop. LangChain's callback manager does the same by default. That has a cost. A broken recorder silently loses part of its record, and the only sign is a warning in the logs.

The "model replied" announcement hands listeners the whole `LLMResponse`. That gave them what the model said and its token counts. It didn't give them why the model said it.

## The model's reasoning had nowhere to go

Phase 2 had left thinking out on purpose until something needed it. An agent acts on its reasoning, so to debug one I'd need to read that reasoning. That was the need.

I expected one feature with two spellings. Probing both providers straight from their SDKs showed otherwise:

|  | Off switch | Thinking text | Separate token count |
| --- | --- | --- | --- |
| Ollama, `qwen3.5:2b` | Real: 434 output tokens down to 4 | Full text | None, it's counted in the total |
| OpenAI, `gpt-5-mini` | Turn down only, "none" is refused | None in Chat Completions | Exact: `reasoning_tokens` |

Each one gives the half the other doesn't. So the switch stays on each adapter in its own terms (`OllamaLLM(..., think=True)`, `OpenAILLM(..., reasoning_effort="low")`), and the result has one slot for the text and one for the count. Each provider fills what it has and leaves the other empty, rather than me estimating a number that would look like a measurement.

Both slots went on `LLMResponse`, not on the message. The message goes in the folder and gets read back to the manager every round. Thinking runs to hundreds of tokens per call, and neither provider needs it sent back. So it lives on the envelope, where listeners can see it, and the folder doesn't pay for it again each round.

With that in place, the console logger could print what the model was thinking at every step. Time for the roadmap's "done when": a live multi-step run.

## The run that got Tokyo wrong

`qwen3.5:2b`, thinking on, two tools, the Paris and Tokyo question. Both weather lookups came back right: 18 and 24, in Celsius. Paris got converted to 64°F. Then the final answer said Tokyo: 24°F.

The step-3 thinking, printed by the console logger, said why:

> "Tokyo is already in Fahrenheit, so I don't need to convert it."

Then I asked the obvious question. Where are the traces, so I can read this run properly? The honest answer was nowhere. I'd talked about a listener that writes every announcement to a file and never built it. The only copy was terminal scroll, which I pasted into my notes by hand.

So I built `TraceRecorder`. It's one more listener on the platform. It writes one JSON object per announcement, one per line, appending to a file (a format called JSON Lines). It opens and closes the file for each line, so a run that crashes keeps everything written before the crash. The agent didn't change at all to get it.

Then I reran the same question six times, all recorded. Want to guess how many got Tokyo wrong?

None. Six right answers in a row. The mistake never came back.

A model's output varies from call to call. Same agent, same question, same tools, and the bug happened once. You can't reproduce it on demand the way you can a normal bug. If I'd only switched tracing on after seeing the problem, I'd never have caught it.

With recording on, the smaller `qwen3.5:0.8b` got it wrong on its first try, and this time the run was in a file. Here's the line that matters, from the trace:

```json
{"run": 1, "step": 2, "event": "model_reply",
 "content": "...- **Paris:** 18°F\n- **Tokyo:** 24°F",
 "reasoning": "...Paris returned 18, and Tokyo returned 24, which are already Fahrenheit temperatures based on the tool's response format...",
 "input_tokens": 453, "output_tokens": 80, "reasoning_tokens": null}
```

Reading a trace has a method: go top to bottom and find the first line that's wrong. Where it is tells you whose problem it is.

1.  A wrong slip (wrong tool or wrong arguments): look at the prompt and the tool's description.
    
2.  A right slip but a wrong answer slip: a bug in the tool.
    
3.  Every answer slip right, but the final reply wrong: the model's reasoning.
    
4.  It never finished: the limit. The trace shows what it kept asking for.
    

Both failures were case 3. But read that reasoning again: "based on the tool's response format." Two lines up in the same trace sits what the model was holding when it guessed:

```json
{"event": "tool_return", "content": "18", "tool_call_id": "call_33577538..."}
```

A bare `"18"`.

## The trace pointed at my tool

The easy conclusion was "small models are bad at this." The trace suggested part of the mistake was mine.

The unit was in `get_weather`'s description all along: "in degrees Celsius". But the description is on the menu, read once at the start. Several rounds later, the manager is holding a slip that just says 18. They have to remember the unit, or guess.

So I tested it, in an earlier session. Same agent, same question, `qwen3.5:0.8b`, 8 runs each. The only change was what `get_weather` returns:

| `get_weather` returns | Right numbers | Said the Celsius numbers were Fahrenheit |
| --- | --- | --- |
| `"18"` | 0 / 8 | 6 / 8 |
| `"18°C"` | 6 / 8 | 0 / 8 |

With the unit in the result, the "already Fahrenheit" mistake disappeared.

The traces showed the 6 out of 8 was messier than it looks. Only 2 of those runs actually called `to_fahrenheit`. Four did the arithmetic themselves, against the prompt's "never do the arithmetic yourself". And one run skipped `get_weather` entirely, made up 10°C and 5°C, converted them properly, and answered 50°F and 41°F with complete confidence. Nothing in that final answer gives it away. Only the trace does.

So without traces, eight wrong runs looked like one finding: the small model gets it wrong. With traces they split into three, each with its own fix. An ambiguous tool result, which was mine to fix. An instruction the small model ignores. And made-up slip details, which is case 1.

How sure am I? It's 8 runs per variant on one tiny model. The direction of the effect is solid. The exact numbers aren't, and I haven't checked whether larger models are affected the same way.

## The whole agent, from the caller's side

Here's the caller, trimmed from the script I ran live:

```python
tools = ToolRegistry()
tools.add(get_weather)
tools.add(to_fahrenheit)

agent = Agent(OllamaLLM("qwen3.5:2b-q8_0", think=True), tools, PROMPT,
              observers=[ConsoleLogger(), TraceRecorder("traces/qwen.jsonl")])
agent.run({"question": "What's the temperature in Paris and in Tokyo, in Fahrenheit?"})

silent = Agent(OllamaLLM("qwen3.5:2b-q8_0", think=True), tools, PROMPT)
silent.run({"question": "What's the temperature in Paris and in Tokyo, in Fahrenheit?"})
```

I re-ran it for this post. The first agent printed every step (thinking cut short here):

```plaintext
[step 1]
  reply: (asks for get_weather, get_weather)   tokens in=374 out=124 thinking=?
  call get_weather {'city': 'Paris'}
  returned: 18
  call get_weather {'city': 'Tokyo'}
  returned: 24
[step 2]
  reply: (asks for to_fahrenheit, to_fahrenheit)   tokens in=453 out=117 thinking=?
  call to_fahrenheit {'celsius': 18}
  returned: 64
  call to_fahrenheit {'celsius': 24}
  returned: 75
[step 3]
  reply: 'Based on the current weather data: ... **64°F** ... **75°F**.'   tokens in=537 out=146 thinking=?
[finish: answered] ...
```

The second agent printed nothing and answered 64°F for Paris and 75°F for Tokyo, in different words. Removing every listener changed nothing but the silence. (`thinking=?` is Ollama having no separate count, as the probe showed.)

Everything from this post is in those few lines:

*   No `memory` is passed, so each agent builds its own `KeepAll` inside the constructor. The two agents don't share a folder.
    
*   `run` takes a question slot and returns an answer slot. The agent is a `Step`, so it fits anywhere a step fits, including inside a `Sequence`.
    
*   Inside `run`, three cards hand off to each other. Here: waiting, errands, waiting, errands, waiting, hung up. The caller never sees them.
    
*   `max_steps` defaults to 10. Hitting it raises instead of returning a fake answer.
    
*   Two listeners on the platform. The agent doesn't know what either one does.
    
*   `think=True` lives on the Ollama adapter. The thinking arrives on the envelope, and only listeners look at it.
    

| What the tutorial said | What this phase taught me |
| --- | --- |
| State: an object changes its behaviour when its internal state changes | Each situation gets its own object, and that object picks the next one. The rules stay; the checking goes. |
| State: the traffic light | A loop whose number of rounds the model decides, where an `if` chain would ask "where am I?" on every line |
| "State" | Two different things: the folder (what has happened) and the card (where you are) |
| Observer: dependents are notified automatically | The subject runs exactly the same with any listeners, including none, and including a broken one |
| Observer: the newsletter | Logging, a test recorder and a trace file, each added without editing the agent |
| Logging is for debugging | With a model in the loop, the failing run may be the only one. Record before you know there's a bug. |

## What's still open, and the capstone

Some things I chose knowingly and haven't had to face yet:

*   A subagent that hits its limit will crash its parent. `StepLimitReached` is the right answer for a direct caller. When a main agent calls a subagent as a tool, something has to catch it.
    
*   The folder carries over between runs. For a chat assistant, that's the point. For a subagent handed two unrelated tasks, the second task's folder still holds the first.
    
*   A broken listener loses data quietly. Only a warning in the logs says the trace has gaps. An audit log that legally has to record every tool call would need the opposite rule.
    
*   Trace run numbers restart per process, so runs appended to one file from separate processes are told apart by time.
    
*   Not built yet: OpenAI's reasoning summaries (they need the Responses API, which is close to a new adapter), and retrying a tool that failed for operational reasons. Both are on the backlog with the trigger that would bring them in.
    
*   Not verified: whether bigger models make the bare-number mistake. `gpt-5-mini` was right in both runs I made, and that's too few to say anything.
    

The next phase is the capstone: a small graph orchestrator, like LangGraph's `StateGraph`. That's where the cards meet LangChain's way of doing it. In a graph, the boxes only do their work, and the "what comes next" moves out of the cards and onto the arrows between them. The listeners come along without changes.

**Links**

*   Code for this phase: [mingraph, phase-7 branch](https://github.com/jairamshegde/mingraph/tree/phase-7)
    
*   [LangChain: Agents](https://docs.langchain.com/oss/python/langchain/agents)
    
*   [LangChain: Streaming](https://docs.langchain.com/oss/python/langchain/streaming)
    
*   [LangChain: Observability](https://docs.langchain.com/oss/python/langchain/observability)
    
*   [LangChain: Built-in middleware](https://docs.langchain.com/oss/python/langchain/middleware/built-in)
    
*   [LangGraph: Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
    
*   [LangGraph `ToolNode` source](https://github.com/langchain-ai/langgraph/blob/main/libs/prebuilt/langgraph/prebuilt/tool_node.py)
    
*   [Python tutorial: default argument values](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)
    
*   Wikipedia: [State pattern](https://en.wikipedia.org/wiki/State_pattern), [Observer pattern](https://en.wikipedia.org/wiki/Observer_pattern)
