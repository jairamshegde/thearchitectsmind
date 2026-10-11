---
title: Strategy and the Registry Pattern Never Clicked for Me Until a Model Started Calling My Functions
subheading: 'LangGraph from Scratch, Phase 3: polymorphism again, except this time the model picks.'
description: 'LangGraph from Scratch, Phase 3: polymorphism again, except this time the model picks.'
date: 2026-10-11
tags:
  - python
  - oop
  - design-patterns
  - LLM
  - function-calling
cover: phase_3_header_image.png
featured: false
draft: false
---

> **In a hurry? Here's the whole post.**
> 
> *   **Phase 3 lets a model ask my code to run one of my Python functions**, and puts the answer back into the conversation.
>     
> *   **The data became polymorphic.** A reply used to be words. Now it can be words, or a request to run something, and my code has to handle whichever kind arrives.
>     
> *   **Strategy is the polymorphism you already know, with one change: the model picks.** Every tool has the same shape, so my code can run any of them without knowing in advance which one it'll get.
>     
> *   **A registry finds a strategy by name.** It doesn't run anything clever. It's just the one place that holds every tool, so it's the only place that can notice two tools sharing a name.
>     
> *   **The payoff:** adding a tool changed no library code. Adding a kind of message touched five files, and that difference is on purpose.
>     

## The Strategy pattern you've already seen

Here's how every tutorial teaches it:

```python
class CreditCard:
    def pay(self, amount): print(f"paid {amount} by card")

class PayPal:
    def pay(self, amount): print(f"paid {amount} by PayPal")

def checkout(strategy, amount):
    strategy.pay(amount)
```

Then the definition. **Strategy**: a family of interchangeable algorithms, each in its own class, chosen at runtime.

I could recite that. It still never clicked, for two reasons.

The first one is how the example ends. Somewhere, somebody writes:

```python
strategy = CreditCard() if method == "card" else PayPal()
```

So there's an `if` after all. The pattern looks like a lot of ceremony around a choice a plain `if` could make.

The second reason bothered me more. In [phase 1](https://github.com/jairamshegde/mingraph/tree/phase-1) of this series I finally understood polymorphism. One line, `llm.generate(prompt)`, ran against OpenAI, Anthropic or Ollama, and the object decided what actually happened. Now look at `checkout` again. Same idea: one line, `strategy.pay(amount)`, and the object decides.

So if Strategy is just polymorphism, why does it get its own name?

Phase 3 answered that for me, and it brought along a second pattern the tutorials rarely mention: the **registry**. Both showed up the day I let a language model call my functions.

## How you write tool calling today

If you've given a model tools, you've probably written something like this:

```python
call = response.choices[0].message.tool_calls[0]
args = json.loads(call.function.arguments)

if call.function.name == "get_weather":
    result = get_weather(**args)
elif call.function.name == "add":
    result = add(**args)
```

It works. I've shipped versions of it. And every new tool means one more `elif`.

Here's the picture I'll use for the rest of the post.

The model is a manager on a phone call who can't reach any files. Before the call, you hand them a menu of errands you can run, each with a name and a line saying what it's for. During the call, they either answer you directly, or pass you a slip: *"run* `get_weather`*, city = Paris"*, stamped with a ticket number. You run the errand and pass back an answer slip with the same ticket number. Only then do they finish their reply.

In code, the list of tools you pass in is the menu, `tool_calls[0]` is the slip, `call.id` is the ticket number, and the `if` chain is you, reading the slip and remembering what to do.

The manager never runs anything. They only ask.

## Then the model answered with a slip instead of words

At the end of phase 2, a message in mingraph looked like this:

```python
@dataclass(frozen=True)
class Message:
    role: Role        # "system", "user" or "assistant"
    content: str
```

A dataclass is a class where Python writes the constructor for you from the fields you list. `frozen=True` means a message can't be changed after it's made.

Who said it, and what they said. That covered every conversation I'd built, because every line was somebody saying words.

Then I wrote out the conversation a tool call actually needs:

```plaintext
system:     You are a helpful assistant.
user:       What's the weather in Paris?
assistant:  get_weather(city="Paris"), ticket call_7
tool:       It is 18°C and cloudy in Paris.   (answers ticket call_7)
```

Look at the third and fourth lines. The manager's reply isn't words any more. It's a slip. And the fourth line isn't said by the user or the manager. It's the errand's result.

My `Message` had nowhere to put either one. No field for "which errand, which details, which ticket". No field for "this answers that ticket".

This part isn't optional, either. The model remembers nothing between calls. Each time, you read it the whole conversation, and that list is all it knows. If the slip isn't in the list, the manager is reading an answer to a question they never asked.

That was the real change in phase 3. Until then, only *behaviour* came in different kinds: each provider did `generate` its own way. Now the *data* came in different kinds too. A line in the conversation could be words, a slip, or an answer slip.

## So each kind of line got its own form

My first instinct was the small fix: add two optional fields to `Message`.

```python
Message("tool", "It is 18°C...", tool_calls=None, tool_call_id="call_7")
```

Before reading on, guess what else those fields let you write.

This:

```python
Message("user", "hi", tool_call_id="call_7")
```

A user holding a ticket number for an errand they never asked for. Nothing stops it. So I'd need a list of rules somewhere: ticket numbers only on answer slips, slips only on the manager's lines, and one more rule for every new kind of line.

In errand terms, that's one form with lots of boxes, plus an inspector who has to remember which boxes each kind of entry is allowed to fill. So I gave each kind of line its own form instead, holding only what that kind can have:

```python
@dataclass(frozen=True)
class UserMessage:
    role: ClassVar[str] = "user"
    content: str

@dataclass(frozen=True)
class ToolMessage:
    role: ClassVar[str] = "tool"
    content: str
    tool_call_id: str
```

There are four of these: `SystemMessage`, `UserMessage`, `AssistantMessage` (which can carry slips) and `ToolMessage`. The rules I was about to write became Python's own errors:

```plaintext
REFUSED  UserMessage with a tool_call_id:    TypeError: UserMessage.__init__() got an unexpected keyword argument 'tool_call_id'
REFUSED  ToolMessage without a tool_call_id: TypeError: ToolMessage.__init__() missing 1 required positional argument: 'tool_call_id'
```

The word `Message` still exists, as one line that lists every kind there is:

```python
Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage
```

The `|` makes it a union: "any one of these four".

**This is polymorphic data.** A conversation is a list where each line can be any of four kinds, and whoever reads it has to handle whichever one arrives.

It isn't quite phase 1's polymorphism, though, and the difference matters later. In phase 1, the *object* decided what to do: I called `generate`, and the provider ran its own code. Here the messages don't do anything. They're forms. The code *reading* them decides, by checking which kind it got. This is from the OpenAI adapter:

```python
if isinstance(m, ToolMessage):
    return {"role": "tool", "tool_call_id": m.tool_call_id, "content": m.content}
if isinstance(m, AssistantMessage) and m.tool_calls:
    return {"role": "assistant", "content": m.content, "tool_calls": [...]}
return {"role": m.role, "content": m.content}
```

Keep that `if` in mind. It comes back at the end.

The conversation could now hold a slip. But nothing could produce one yet, because the manager had never been told my errands existed.

## The manager still didn't know my errands existed

To offer the model a tool, you send three things: its name, a line about what it does, and a description of its arguments in JSON Schema (a standard way to write "an object with a string called `city`").

My first plan was to write those by hand next to each function. Then I looked at the function:

```python
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"It is 18°C and cloudy in {city}."
```

Everything is already there. The name is the function's name. The description is its docstring, the string on the first line. The arguments and their types are the parameters and their type hints (`city: str`).

So I made each tool a card. The front is what the manager sees on the menu: name, what it's for, what details a slip must carry, all read off the function. The back is how to actually do it: the function itself. Writing `@Tool` above a function turns it into a card:

```python
@Tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"It is 18°C and cloudy in {city}."
```

The `@` line is a decorator. It means `get_weather = Tool(get_weather)`: the function goes in, a card comes out. LangChain's `@tool` works the same way: ["the function's docstring becomes the tool's description"](https://docs.langchain.com/oss/python/langchain/tools).

Every card has the same layout: a name, a description, a schema, and a `run` method. `get_weather` and `add` do completely different things, but my code can treat them the same way: read the front, and call `run` with the details from the slip.

That's Strategy. And yes, it's the same polymorphism as phase 1. One call, `tool.run(args)`, and the card decides what happens.

What's new is who picks. In phase 1, I chose the provider when I wrote the code: `llm = OpenAILLM(...)`. Here I don't choose at all. The model reads the menu and picks a card, by name, while the program is running. That's the part the payment tutorial hid behind its `if`. The tutorial made the choice itself, so it never needed Strategy. I can't make the choice, so I do.

|  | Phase 1 | Phase 3 |
| --- | --- | --- |
| The same call | `llm.generate(...)` | `tool.run(args)` |
| The object decides | what request to send | what errand to do |
| Who picks the object | me, in the code | the model, at runtime, by name |

So now the manager hands me a slip, and the slip only carries a name: `"get_weather"`. Somehow a name has to become a card.

## A name has to become a card

Think of your phone's contact list. You save a contact under a name, and later you find it by that name. The contact list doesn't make calls. It only finds the right number.

That's all I needed: put a card in under its name, and find a card by name. Python already does that. It's a dict:

```python
tools = {"get_weather": get_weather, "add": add}
tools[call.name].run(call.args)
```

One line replaces the whole `if` chain. For a while I couldn't see what a class would add. In phase 2 I'd decided *not* to build a class around the conversation, because a plain list already did the job.

Then I tried the case a dict handles badly: two tools that end up with the same name. One searches the web, one searches local files, and both are called `search`.

Before reading on, guess what happens.

```plaintext
dict after adding both: ['search']
dict['search'] runs:    files result
```

No error. The dict quietly kept the last one. The menu now offers one `search`, and every `search` the model asks for runs the file one. The web search is just gone.

Now ask who could have caught it. The web-search card can't: it doesn't know the file-search card exists. The file-search card can't either. The clash can't be seen from inside any one card. Only the thing holding all of them can see it.

That's what finally told me when a collection deserves its own class: when there's a rule about the whole group that no single member can check. A conversation had no such rule, so a list was enough. Tools do: names must be unique, because the name is the only way the model can say which one it wants.

So the contact list became a small class around a dict:

```python
class ToolRegistry:
    def add(self, tool: Tool) -> None:
        if not isinstance(tool, Tool):
            raise TypeError(f"expected a Tool, got {type(tool).__name__} (missing @Tool?)")
        if tool.name in self._tools:
            raise ValueError(f"a tool named {tool.name!r} is already registered")
        self._tools[tool.name] = tool
```

```plaintext
registry refused:       a tool named 'search' is already registered
```

**This is the registry pattern:** one object that owns the lookup from a name to a strategy. The strategies do the work. The registry only knows where each one is, and it's the only place a rule about all of them can live.

It picked up one more job, because it was already holding everything. Every answer slip has to carry the same ticket number as the slip it answers, or the provider rejects the conversation. So the registry answers a whole slip, and the ticket number gets copied in exactly one place:

```python
def run(self, call: ToolCall) -> ToolMessage:
    return ToolMessage(self.get(call.name).run(call.args), tool_call_id=call.id)
```

With that, the `if` chain from the start of this post has nowhere left to live.

## The caller that never names a tool

```python
response = llm.generate(messages, tools=registry.tools)
if response.stop_reason != "tool_call":
    return response.message.content

messages.append(response.message)
for call in response.message.tool_calls:
    messages.append(registry.run(call))

final = llm.generate(messages, tools=registry.tools)
return final.message.content
```

There's no `if name == ...` in it, and it never mentions a particular tool. The schemas and the ticket numbers are handled elsewhere.

Each part of the story is one line here:

*   `tools=registry.tools` is the menu: the front of every card.
    
*   `messages.append(response.message)` works because a message kind exists that can carry a slip. That's the polymorphic data.
    
*   `registry.run(call)` is the registry finding the card by name, and the strategy on that card doing the errand.
    

Then the test I cared about most, straight from the roadmap: add a second tool without touching any code that isn't the tool.

```python
@Tool
def add(a: int, b: int) -> int:
    """Add two whole numbers."""
    return a + b

registry.add(add)
```

```plaintext
Q: What's the weather in Paris right now?
  1st reply: stop_reason='tool_call'  ->  get_weather(city='Paris')
  A: The weather in Paris right now is 18°C and cloudy.

Q: What is 1234 + 5678?
  1st reply: stop_reason='tool_call'  ->  add(a=1234, b=5678)
  A: 1234 + 5678 equals 6912.
```

The model picked the right card both times, and my code never knew in advance which one it would be.

My first explanation was that tools are just smaller. They aren't. A tool has a name, a description, a schema and a function. `ToolMessage` has two fields.

The real difference is that `if` I asked you to remember. Cards are handled the same way every time: look up by name, read the front, call `run`. So one more card costs nothing. Message kinds are handled case by case: every adapter has a branch per kind, because each kind becomes different JSON for each provider. So a new kind means a new branch in every adapter.

That's why tools are open and message kinds are closed, on purpose. Anyone can add a tool from any file, and the registry's one rule keeps that safe. Adding a message kind means editing that one union line, in the file where the other four kinds live, which is exactly where you'd stop and ask which adapters need to learn this?

Back to the payment tutorial. It had the strategies, but it made the choice itself with an `if`, so the pattern looked pointless. Once the choice comes from outside my code, as a name I didn't pick, Strategy stops being ceremony. And the registry becomes the obvious object to hold them.

| The tutorial wording | What phase 3 taught me |
| --- | --- |
| Strategy: a family of interchangeable algorithms. | Polymorphism I already knew, but chosen by name at runtime, by something outside my code. |
| Choose the strategy at runtime. | The choice arrives as text from a model, so a lookup is the design, not an afterthought. |
| Registry: rarely mentioned. | The object that owns name → strategy, and the only place a rule about the whole set can live. |
| Polymorphism: many forms, one interface. | Data can have many forms too. Then the reader decides, not the object, and that makes the set hard to extend, on purpose. |

## Next up: memory

Look at the caller one more time. It asks the model, runs the errands, and asks once more. Exactly one round. If the second reply asked for another errand, nothing would run it.

A loop would fix that. But the moment you loop, the conversation keeps growing, and you have to decide how much of it to read to the manager each time. All of it, the last ten lines, or a summary of the older ones?

That's phase 4: memory. Several ways of choosing what to send, behind one shape, so switching between them is a one-line change. It also brings the first case where a base class should hold shared code, which is a pattern called Template Method.

Thank you for reading 🙂, see you in the next post 👋
