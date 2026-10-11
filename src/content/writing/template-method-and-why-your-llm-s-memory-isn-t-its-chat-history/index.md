---
title: Template Method, and Why Your LLM's Memory Isn't Its Chat History
subheading: 'LangGraph from Scratch, Phase 4: three ways to forget, one set of steps that never changes'
description: 'LangGraph from Scratch, Phase 4: three ways to forget, one set of steps that never changes'
date: 2026-10-11
tags:
  - python
  - oop
  - design-patterns
  - context-engineering
cover: phase_4_cover_image.png
featured: true
draft: false
---

> **In a hurry? Here's the whole post.**
> 
> *   **Template Method is a base class that runs the steps and asks the subclass for one of them.** The steps that must never differ live where no subclass can touch them.
>     
> *   **The surprising part is the direction.** The parent calls the child, not the other way round, and it works through `self`.
>     
> *   **Phase 4 used it for memory**: keep everything, keep the last few turns, or summarise the old part. Each one writes a single method. Adding the most complicated one changed no line of the base.
>     
> *   **The bigger lesson was about the list itself.** The conversation history is the record of what happened, and it's never edited. What the model sees is a new list, built from that record for each call. Building that list on purpose is what people call context engineering.
>     

## The Template Method you've already seen

The textbook definition, from the Gang of Four book:

> Define the skeleton of an algorithm in an operation, deferring some steps to subclasses.

And the tutorial example is usually drinks:

```python
class HotDrink:
    def make(self):
        print("boil water")
        print(self.brew())
        print("pour into cup")

class Tea(HotDrink):
    def brew(self):
        return "steep the tea bag"
```

I could recite that. It never clicked, for two reasons.

The first is that it looked like plain inheritance with extra steps. `Tea` inherits from `HotDrink`, overrides a method, done. Why does this need a name?

The second one I didn't admit for a long time. I didn't understand *how* it worked. `HotDrink` never mentions `Tea`. So how does `HotDrink.make()` end up running `Tea.brew()`? It felt backwards. I was used to children calling their parents with `super()`, not parents calling their children.

Phase 4 cleared up both. It started with a list that kept getting longer.

## How you keep a conversation today

If you've built a chatbot, you've written this. I did, in [phase 2](https://github.com/jairamshegde/mingraph/tree/phase-2) of this series:

```python
history = [SystemMessage("You help plan our family trip."), UserMessage("Hi")]
response = llm.generate(history)
history.append(response.message)
```

Chat APIs don't remember anything between calls. So every call sends the whole conversation again: the system message first (the instructions for how to behave), then user, assistant, user, assistant, in order. The list grows by two messages every turn.

Here's a picture I'll keep coming back to. Your family has a group chat about a trip. You want advice from a friend who isn't in the group. They've seen none of it, and they don't remember anything between your questions. So every time you ask them something, you catch them up first. You forward them the chat.

In code: the friend is the model, the family chat is `history`, and the forward is what you pass to `generate`.

For a while, forwarding the whole chat every time is fine.

## Then the chat got long

At some point, the whole chat stops being a good idea. LangChain's [short-term memory page](https://docs.langchain.com/oss/python/langchain/short-term-memory) gives the reasons: a long history may not fit in the model's context window, models do worse when old, off-topic messages distract them, and longer inputs are slower and cost more.

Think about the friend. A forward of the whole chat is a wall of text. They skim. Past a certain length, it won't even go through.

So you forward less. There are three obvious ways:

*   The whole chat: they have everything, but it's huge.
    
*   Only the last few messages: quick, but they miss "we land in Pune on the 5th" from way back.
    
*   A recap you type, plus the last few: short, and they get the gist. But writing a recap takes effort, and it might leave out the one detail that mattered.
    

Keeping it small and keeping what's needed pull against each other. No option wins on both, so the right one depends on the conversation. That means the calling code shouldn't care which one it has.

I needed three strategies that could be swapped freely, sharing every step that must never differ between them. That's Template Method. Before I could build it, I had to find out what those shared steps were.

## Three strategies, and only one step that differed

I wrote down what each strategy has to do on every call:

1.  Put the system message first.
    
2.  **Choose what to send from the conversation.**
    
3.  Hand back one list.
    

Before reading on: which of those differ between "whole chat", "last few" and "recap"?

Only step 2. Everything else is identical.

My first try at explaining this to myself was "a routine with a named blank that subclasses fill in". It's accurate, and I couldn't picture a thing. What worked was the forward button. When you forward messages, you do exactly one thing: tick the ones you want. WhatsApp does everything else, the same way for everyone. Mom ticks every message, my brother ticks the last few, and neither of them can mess up the sending, because neither of them does the sending.

So the base class does the sending, and each strategy only ticks:

```python
class Memory(ABC):
    def messages(self) -> list[Message]:
        return [self._system, *self._pick(self._turns())]

    @abstractmethod
    def _pick(self, turns: list[Turn]) -> list[Message]: ...

class LastN(Memory):
    def _pick(self, turns):
        return [m for turn in turns[-self._n:] for m in turn]
```

`messages()` is the *template method*: it fixes the order of the steps. `_pick` is the *hook*: the one step each subclass writes. The underscore means "the base calls this, you don't". (Ignore `_turns()` for now. It comes back later.)

Now the "backwards" part, the one that confused me in the tea example. It comes down to one question: who's in charge of the process?

Usually, the child is. It writes the process and calls *up* to its parent for help:

```python
class Tea(HotDrink):
    def make(self):
        super().make()      # Tea runs things, and asks the parent for help
        print("add lemon")
```

Template Method flips that. The parent writes the process and calls *down* to the child for one step. `HotDrink.make()` boils, then asks `self.brew()`, then pours. In the forward-button picture, you don't run the forward and ask WhatsApp for help. WhatsApp runs it, and at one point asks you: which messages?

So how can a parent call a method on a child it has never heard of? It never calls `Tea`. It calls `self`. And `self` isn't "the class whose code is running". It's the object you actually made. When you make a cup of tea and call `make()`, the code that runs belongs to `HotDrink`, but the cup in your hand is still tea. So when the parent says "brew yourself", it's tea that answers.

`Memory` works the same way. Here's what happens on `LastN(2, ...).messages()`:

1.  Python looks for `messages` on `LastN`. It isn't there, so it runs `Memory.messages`.
    
2.  Inside that call, `self` is still the `LastN` object. Running the parent's code doesn't turn it into a `Memory`.
    
3.  At `self._pick(...)`, Python looks for `_pick` starting from the object's own class, and finds `LastN._pick`.
    

The parent says "whoever I am, pick", and `self` points to the real object.

And a base with a hole in it can't be used until someone fills the hole:

```plaintext
>>> Memory(system)
TypeError: Can't instantiate abstract class Memory without an implementation for abstract method '_pick'
```

So the steps were in the base. The next question was what *data* belonged there with them.

## Who keeps the chat?

Every strategy needs messages to choose from. So where do the messages live?

Way back in phase 1, I made myself a rule: only move something into a base class if every subclass needs it for the same reason, not just because the lines look alike. I'd predicted that memory storage would be the first thing to pass that test.

It almost didn't. `KeepAll` needs every message. `Summarise` needs the old ones for its recap. But `LastN` only ever sends the last few. It could keep a small window and throw the rest away. That's less memory, and arguably the "natural" `LastN`.

The forward button settled it. When my brother forwards the last few messages, nothing gets deleted from the family chat. The chat belongs to the family, and forwarding is just choosing from it. If his way of forwarding *deleted* the older messages, the next person who wanted the whole chat couldn't have it.

So that's the reason, and it's the same for all three: **the chat is the record, and strategies only choose from it. Choosing isn't deleting.** The chat goes in the base:

```python
class Memory(ABC):
    def __init__(self, system: SystemMessage):
        self._system = system
        self._chat: list[Message] = []
```

The system message goes in the constructor, not through `add()`. If it came in like any other message, I'd need rules for two system messages, or one added halfway through. With one slot for it, there's always exactly one, and it's always first. `add(SystemMessage(...))` raises an error, so there's no second way in.

I got one thing wrong here, and it's worth showing. I first put "keep the chosen messages in their original order" in the base too. WhatsApp sorts ticked messages back into chat order, so why wouldn't the base? That broke as soon as I thought about the recap. A recap is a message the chat never had, so it has no position to sort by. Typing a recap isn't ticking. So ordering moved out to the strategies, and the base now guarantees only what it can actually see: the system message goes first.

With storage settled, I wrote `LastN` for real. It had a problem I hadn't seen coming.

## The day LastN split a question from its answer

[Phase 3](https://github.com/jairamshegde/mingraph/tree/phase-3) added tool calling. So a conversation isn't just user, assistant, user any more. The model's request to run a tool and the tool's result are two separate messages, joined by an id:

```python
UserMessage("Weather in Pune?"),
AssistantMessage("", tool_calls=[ToolCall("get_weather", {"city": "Pune"}, "c1")]),
ToolMessage("31°C", tool_call_id="c1"),
AssistantMessage("It's 31°C."),
UserMessage("And tomorrow?"),
```

Guess what a `LastN(3)` that counts messages would send.

```python
[ToolMessage("31°C", tool_call_id="c1"),   # the answer to request "c1"...
 AssistantMessage("It's 31°C."),
 UserMessage("And tomorrow?")]             # ...but "c1" was cut off
```

*(Worked out by hand to show the problem. mingraph never shipped this version.)*

It's like forwarding your friend "Yes, 31°C" without the message it answered. And it's not just confusing. LangChain's docs warn that providers reject it: "Most providers require `assistant` messages with tool calls to be followed by corresponding `tool` result messages", and "Some providers expect message history to start with a `user` message."

My first two fixes both felt wrong:

*   The base cleans up afterwards, dropping any tool result whose request isn't there. That fixes one rule, not the other, and it silently sends less than the strategy picked.
    
*   Each strategy moves its own cut to a safe spot. That works until someone writes a fourth strategy and forgets. Then the provider finds out before I do.
    

> Both let the cut land anywhere and then patch it. So I went looking at how others do it. OpenAI's [session memory cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/session_memory) doesn't count messages at all. It counts **turns**: "a user message and all subsequent items (assistant/tool calls/results) up to (but not including) the next user message".

In the family chat: your question and everything that came back before your next question are stapled into one bundle. You forward bundles, never loose pages.

That's the `_turns()` I asked you to ignore earlier. The base groups the chat into turns *before* asking the strategy anything, so `_pick` receives turns and can only cut between them:

```python
def _turns(self) -> list[Turn]:
    turns: list[Turn] = []
    for message in self._chat:
        if isinstance(message, UserMessage) or not turns:
            turns.append([])
        turns[-1].append(message)
    return turns
```

Here's the real `LastN(2)` on that chat:

```plaintext
system    'You help plan our family trip.'
user      'Weather in Pune?'
assistant '' tool_calls=['c1']
tool      '31°C' tool_call_id=c1
assistant "It's 31°C."
user      'And tomorrow?'
```

Both rules hold, and nothing checks them. Tool results travel with their request, because they're in the same turn. What's sent starts with a user message, because every turn does.

Patching the cut is harder than it looks, even for framework authors. LangChain's `SummarizationMiddleware` searches for a safe cutoff to keep "AI/Tool message pairs" together. Its JavaScript version still shipped a bug where the kept messages could *start* with an AI tool-call message, which Gemini rejects ([langchainjs #9272](https://github.com/langchain-ai/langchainjs/issues/9272)).

That left the third strategy, the only one that writes something new.

## Who is the recap from?

`Summarise` sends a recap of the old turns plus the recent ones whole. The recap is written by a model, so it has to become one of mingraph's four message types.

My first answer was `AssistantMessage`. A model wrote it, and `llm.generate()` literally returns an `AssistantMessage`.

That's half right. Say you ask a friend to draft the recap for you. They write it, you paste it into your chat, and you send it. To the person reading, it arrives **from you**. Who drafted it doesn't show up anywhere.

The summarising call is a separate side conversation. Its reply is an assistant message *there*. In the main conversation, our code hands the recap over as background, and the model never said it. So it goes in as a user message:

```python
UserMessage("Here is a summary of the conversation to date:\n\n" + recap)
```

LangChain does the same thing, in [the same words](https://github.com/langchain-ai/langchain/blob/master/libs/langchain_v1/langchain/agents/middleware/summarization.py). As an assistant message, it would put words in the model's mouth, and the list would start with an assistant message, breaking the rule turns had just fixed.

Then I asked the question that changed how I see this whole phase: where does the recap *go*? Into the history?

## So where does the recap go?

I was confused, and it took me a while to say why. Does the recap get inserted into the history? Do the old messages get deleted? Or is there some separate list that gets attached?

I couldn't answer, because in my head "the history" and "what the model sees" were the same list. In phases 2 and 3 they were. And LangChain's own examples edit the history in place: its trimming and summarising middleware remove messages from the agent's state and put the summary there.

Go back to the family chat. When you forward your friend a recap and the last few bundles, does anything change in the family chat? No. Nobody edits it. The forward is something you put together for this one question, from the chat.

It turned out the old `history` list had been doing two jobs:

1.  The record: everything that actually happened, in order.
    
2.  What gets sent: the list passed to `generate`.
    

Memory splits them. The record moves inside the `Memory` object. It only grows, and nothing ever edits it. What gets sent is a new list, built from the record every time `messages()` is called, and thrown away after the call:

```python
memory = LastN(2, system=SystemMessage("You help plan our family trip."))
memory.add(UserMessage("Hi"))                  # the record grows, like history.append
response = llm.generate(memory.messages())     # a NEW list, built from the record
memory.add(response.message)                   # the record grows again
```

Only things that really happened get `add()`\-ed: what the user said, what the model replied, what a tool returned. Everything a strategy builds is a throwaway copy for sending. That includes the recap. I checked: after ten turns of `Summarise` with two recaps written, the record held all 22 messages, and no recap.

Here's the part I liked most. With `KeepAll`, the list that gets sent is exactly my old `history`. **What I'd been doing in phases 2 and 3 was already a memory strategy.** It just didn't have a name.

This has a name too. LangChain calls it context engineering: "the delicate art and science of filling the context window with just the right information for the next step" ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)). Once the record and the forward are separate, the question stops being "how do I keep this list short?" and becomes "what should the model see for this step?"

But there was a cost. If the recap is never stored, `Summarise` would call a model on every single `messages()` to write it again.

## A recap card that gets rewritten rarely

So `Summarise` keeps its latest recap in its own attribute. Think of it as a recap card. On Monday you write your friend a card covering the chat so far. On Tuesday you hand over the same card plus everything since Monday. Only when the pile since Monday gets too thick do you rewrite the card.

Two numbers control it. `keep` is how many turns stay whole after a rewrite. `trigger` is how many uncovered turns you allow before rewriting. With `keep=2, trigger=5`, using a fake summariser so the calls show up:

```plaintext
turn  5: sent system + ['question 1', ..., 'question 5']
    [summariser call #1]
turn  6: sent system + ['...summary...: RECAP#1', 'question 5', 'question 6']
turn  9: sent system + ['...summary...: RECAP#1', 'question 5', ..., 'question 9']
    [summariser call #2]
turn 10: sent system + ['...summary...: RECAP#2', 'question 9', 'question 10']
```

Two summarising calls in ten turns, not ten. Every call sends the card plus *every* turn it doesn't cover, so nothing falls between them.

What does a rewrite read? My instinct was "re-read the last 10 old turns, raw", because a recap made from a recap loses a little each time, like a photocopy of a photocopy. The worry was right. The fix had a hole. At turn 30 the card covers turns 1–28. Re-read only 19–28 and throw the old card away, and turns 1–18 are gone. Re-reading *every* old turn fixes that, but it grows forever, until the summarising call itself doesn't fit.

So a rewrite reads the old card plus the turns it doesn't cover yet. It's bounded and gap-free, and it drifts. LangChain made the same choice.

One last detail. The summariser gets the old turns as a plain-text printout (`user: ...`, `assistant: (called get_weather ...)`, `tool: 31°C`), not as real messages. It's being asked to *read* them, not join the conversation, so none of the tool-call rules apply.

All three strategies existed. The last thing to check was whether the calling code could tell them apart.

## The caller that doesn't know which memory it has

Here's the caller, written once:

```python
def chat(llm, memory):
    for question in QUESTIONS:
        memory.add(UserMessage(question))
        response = llm.generate(memory.messages())
        memory.add(response.message)
```

Four questions. The first says "Hi, I'm Asha. We land in Pune on the 5th." The last asks "What's my name, and which day do we land?" Same `chat()`, three memories, live on `gpt-4o-mini`:

| Memory | Sent | Input tokens | Answer |
| --- | --- | --- | --- |
| `KeepAll()` | 8 messages | 148 | "Your name is Asha, and you land in Pune on the 5th." |
| `LastN(1)` | 2 messages | 36 | "I'm sorry, but I don't have access to your personal information or trip details." |
| `Summarise(keep=1, trigger=2)` | 5 messages | 97 | "Your name is Asha, and you land on the 5th." |

A local Ollama model (`gemma3:12b-it-qat`) gave the same pattern. It's the trade-off from the start of the post, measured. Keep everything and pay the most. Keep the last turn and forget. Summarise, and remember the facts for about two-thirds of the price.

Everything from this post is in those four lines:

*   `memory.messages()` is the template method, and the object decides what it does. That's polymorphism, the same idea as phase 1's `llm.generate()`, now sitting on top of a template.
    
*   `add()` only ever grows the record. `messages()` builds a new list each time.
    
*   The system message comes first, every turn is whole, and no recap is ever stored, and `chat()` wrote none of that.
    

And the proof that the template holds: the commit that added `Summarise`, the most complicated strategy by far, changed no line of the `Memory` base.

Back to tea and coffee. The drink example had the steps and the hook, but nothing that could go wrong if a subclass rewrote the steps. Here, a strategy that forgot the system message, or cut a turn in half, would break a real call. That's what the base protects.

| The tutorial wording | What phase 4 taught me |
| --- | --- |
| "Define the skeleton of an algorithm, deferring some steps to subclasses." | Put the steps that must never differ where no subclass can touch them. |
| "Subclasses redefine certain steps." | The hook's signature decides what subclasses can get wrong. `_pick(turns)` made a bad cut impossible. |
| Inheritance: "reuse code from the parent." | Put state in the base only when every subclass needs it for the same reason. |
| "The parent calls the child." | It works through `self`: the parent's code runs, but `self` is still the child. |
| Conversation history. | A record. What the model sees is built from it, fresh, every call. |

## What's next

A few things I haven't verified:

*   Drift: rolling recaps should lose early details after enough rewrites. I haven't seen it happen in a real run yet. When I do, re-reading from scratch is waiting in the backlog.
    
*   Turn size: `LastN(2)` means two turns, and one turn with five tool calls is big. Nothing bounds that.
    
*   The record lives in RAM for as long as the `Memory` object does. Saving it (LangChain uses a checkpointer for that) and memory that carries across conversations are both parked.
    

And the forward is only one of four moves in context engineering. This phase was *compress*: send less. The others are *select* (pull in only what's relevant), *write* (keep notes outside the chat) and *isolate* (give a subtask to a separate model with its own clean context). Select shows up in phase 6, with retrievers.

First comes phase 5. Look at `chat()` again: add, generate, add. It's a pipeline of steps, and so is almost everything around an LLM. Phase 5 builds one shape for a step, and containers that hold steps *and are steps themselves*, so a whole pipeline fits anywhere a single step does. That's the Composite pattern.

Thank you for reading 🙂, see you in the next phase 👋

* * *

*   Code: [mingraph, phase 4 branch](https://github.com/jairamshegde/mingraph/tree/phase-4)
    
*   [LangChain: short-term memory](https://docs.langchain.com/oss/python/langchain/short-term-memory)
    
*   [OpenAI cookbook: session memory](https://developers.openai.com/cookbook/examples/agents_sdk/session_memory)
    
*   [LangChain: context engineering for agents](https://www.langchain.com/blog/context-engineering-for-agents)
