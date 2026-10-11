---
title: Abstraction and Polymorphism Never Clicked for Me Until I Wrapped Three LLM APIs
subheading: 'LangGraph from Scratch: Design Patterns in Python, Phase 1: one base class, three providers, and the two OOP ideas hiding inside them'
description: 'LangGraph from Scratch: Design Patterns in Python, Phase 1: one base class, three providers, and the two OOP ideas hiding inside them'
date: 2026-10-11
tags:
  - python
  - oop
  - design-patterns
  - LLM
  - langchain
cover: phase_1_header_image.png
featured: false
draft: false
---

> **In a hurry? Here's the whole post.**
> 
> *   **Tutorial examples like** `Dog.speak()` **have no caller and nothing messy to hide.** That's why the definitions never land.
>     
> *   **Abstraction is a promise to callers.** Here the promise is a single method: `generate(prompt) -> str`.
>     
> *   **Python only checks that the promised method *name* exists.** The method's arguments and return value are up to you.
>     
> *   **The promise protects the caller, not the providers.** Only a real request proves that a provider works.
>     
> *   **Keep the promise small.** Setup code, and lines that just happen to look the same, stay out of the base class.
>     
> *   **Polymorphism is the payoff.** One line, `llm.generate(prompt)`, runs against OpenAI, Anthropic or Ollama, and the object decides what actually happens.
>     

## *Why the definitions never clicked*

You've probably seen this one:

```python
class Animal:
    def speak(self): ...

class Dog(Animal):
    def speak(self): return "Woof"

class Cat(Animal):
    def speak(self): return "Meow"
```

Then come the definitions.

1.  **Abstraction**: hide the complexity, show only what's needed.
    
2.  **Polymorphism**: many forms, one interface.
    

You nod along, then go back to writing LLM code and never think about it again. That was me. I could recite both definitions, but I couldn't have told you when I'd need either one.

Julia Evans [names this problem](https://jvns.ca/blog/confusing-explanations/) in a post about confusing explanations: *"I've never implemented a bicycle or car in my code! It doesn't tell me anything about what interfaces are useful for!"*

Looking back, the `Animal` example is missing two things:

1.  **A caller**: some code that depends on `speak()` and doesn't care which animal it gets.
    
2.  **Real mess**: something complicated that actually needs hiding.
    

Phase 1 of this series gave me both. This post builds the two ideas one at a time. Abstraction comes first and takes shape over six questions. Polymorphism comes at the end, as what all of that work pays for.

## *The problem: Can we try Claude for this?*

Say you have a helper that summarises text, written directly against the OpenAI SDK:

```python
def summarize(text: str) -> str:
    response = client.chat.completions.create(model=MODEL, messages=[...])
    return response.choices[0].message.content
```

Then someone asks whether you can try Claude. Here's how you get the text back from each of the three providers I ended up supporting:

```python
response.choices[0].message.content          # OpenAI
response.message.content                     # Ollama
"".join(b.text for b in message.content if b.type == "text")#Anthropic
```

The three response shapes are all different. Anthropic also rejects any request that doesn't set `max_tokens`. Ollama has no API key at all, because it's a server running on your own machine.

What I wanted was for `summarize` to contain one line that never changes, no matter which provider is behind it:

```python
llm.generate(prompt)
```

Here's the picture I kept in my head. A travel plug adapter: your hairdryer has one plug, sockets differ by country, and a small adapter sits in between.

*   **The hairdryer** is the caller, `summarize`.
    
*   **The wall sockets** are the three SDKs, which you can't change.
    
*   **The adapters** are one small class per provider.
    
*   **The fits any socket spec** is what we build first.
    

That leads to the first question: **what must every provider have in common?**

## *1\. What must every provider share? A promise*

For `llm.generate(prompt)` to work on any provider, every provider has to offer that method, in that shape. That's all `summarize` needs. It doesn't need the API key, `max_tokens`, or `choices[0]`.

So I wrote the promise down as a base class with a single method:

```python
from abc import ABC, abstractmethod


class BaseLLM(ABC):
    """contract every LLM provider must satisfy.
    callers depend only on this interface, never on a specific provider.
    """
    @abstractmethod
    def generate(self, prompt: str) -> str:
        """send prompt to the model and return its text response."""
        raise NotImplementedError
```

This is the first real meaning of **abstraction**. **Hide complexity** is too vague. It's a *decision about what callers are allowed to depend on*. In plug terms, it's the *fits any socket* spec: it describes the plug and says nothing about what's inside any adapter.

A promise written in a docstring is only words, though. **Does Python do anything to enforce it?**

## *2\. Does Python enforce the promise? Only the name*

Before reading on, make a guess. What happens when you run this?

```python
BaseLLM()
```

I expected the `NotImplementedError` I'd written. Here's what I actually got:

```plaintext
TypeError: Can't instantiate abstract class BaseLLM without an implementation for abstract method generate
```

I never called `generate`. Python stopped me while it was creating the object. In plug terms, you can't buy *the spec* in a shop, only actual adapters. The shop turns you away at the counter instead of selling you an empty box.

Then I tested what the check actually looks at, using a provider with the wrong method signature:

```python
class WrongShape(BaseLLM):
    def generate(self):        # no prompt parameter
        return "nothing"

w = WrongShape()               # created without complaint
w.generate("hi")
# TypeError: WrongShape.generate() takes 1 positional argument but 2 were given
```

The check only looks for the name `generate`. It doesn't look at the arguments or the return value.

So Python guarantees that every provider has a `generate`. Next, I had to write those providers, and that's where the promise's limits showed up.

**Once a provider has the right shape, is it correct?**

## *3\. What does the promise protect? The caller, not the providers*

Here's the Anthropic provider, the one that deals with the most mess:

```python
class AnthropicLLM(BaseLLM):
    def __init__(self, model: str, api_key: str | None = None, max_tokens: int = 1024):
        self._client = Anthropic(api_key=api_key)
        self._model = model
        self._max_tokens = max_tokens

    def generate(self, prompt: str) -> str:
        message = self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text")
```

Everything specific to Anthropic stays inside this class: `max_tokens`, the content blocks, and the join. That's the second half of abstraction. Whatever isn't part of the promise stays hidden.

Hiding things has a cost, though, and a bug showed it to me. For a while, my uncommitted OpenAI provider looked like this:

```python
response = self._client.responses.create(
    model=self._model,
    messages=[{"role": "user", "content": prompt}],
)
```

OpenAI's Responses API takes `input=`, not `messages=`, so this call would have failed the first time it ran. Nothing in my code noticed. The class still inherited from `BaseLLM`, still had `generate(prompt) -> str`, and still got created without complaint. I only caught it by reading my own diff.

In plug terms, the adapter fit the wall and the plug fit the adapter, but the wires inside were crossed. You can check an adapter's shape in the shop. You only find out about the wiring when you switch it on.

| Kind of correct | Question | Who checks it |
| --- | --- | --- |
| **Shape** | Does the class have `generate`? | Python, when the object is created (section 2) |
| **Wiring** | Does `generate` send a valid request to *this* provider? | Only the provider's API, when the request is sent |

The promise covers only the first row. It can't cover the second, because the provider-specific details are exactly what it hides.

So the risk lives inside the provider classes. **What exactly are those classes?**

## *4\. What is a provider class, really? An adapter, where my guarantees end*

In every docstring I'd written *OpenAI adapter for BaseLLM*. Each of those classes is also a subclass of `BaseLLM`, so "implementation" would have been just as accurate. When I stopped to think about it, I couldn't say how the two words differ.

The plug picture answers it. You take a US hairdryer to the UK. Nobody redesigns the hairdryer or the socket. You buy a small piece of plastic whose only job is to make two things fit that were never designed for each other.

So the test for *adapter* is: **is there something on the other side of the class that you didn't write and can't change?**

*   OpenAI's SDK, Anthropic's SDK, Ollama's client: yes. All three classes are adapters.
    
*   A `FakeLLM` for tests that returns a fixed string: no. You control both sides, so it's just an implementation.
    

An adapter has two sides. One side faces the caller and keeps the promise. The other side faces someone else's SDK, and the bug from section 3 was on that side.

\> Adapter is a classic design pattern, not something LangChain invented. \[[Refactoring.guru](http://Refactoring.guru)'s adapter page\]***(***[*https://refactoring.guru/design-patterns/adapter/python/example*](https://refactoring.guru/design-patterns/adapter/python/example)***)*** shows the structure at a glance.

Put the three adapters side by side, and their setup looks completely different. **Should the promise cover setup too?**

## *5\. What belongs in the promise? Only what callers use*

Here are the three constructors:

```python
OpenAILLM(model, api_key=None)
AnthropicLLM(model, api_key=None, max_tokens=1024)
OllamaLLM(model, host="http://localhost:11434")
```

My first instinct was to move the shared parts into `BaseLLM`. `model` appears in all three, and `api_key` in two of them, which is *almost* shared.

Then I noticed that these two pieces of code answer different questions:

*   `generate` answers *what can a caller ask any provider to do?* Every caller depends on it.
    
*   **The constructor** answers *what does this particular provider need before it can do that?* No caller depends on it.
    

Only the first belongs in the promise. The *plug spec says plug in and power comes out*. It doesn't require every adapter to contain a fuse.

*Almost shared* is a trap. If `api_key` lived in the base class, `OllamaLLM` would inherit a parameter that means nothing to a local server. And it gets worse with every new provider: an Azure-hosted OpenAI class needs an endpoint URL, and a Bedrock class needs an AWS region.

Keeping setup out of the promise paid off right away. Adding `OllamaLLM` late in the phase didn't require touching the other two classes.

One line in those constructors is identical in all three, though. **Doesn't that belong in the base class?**

## *6\. What about the line all three share? Only if it's there for the same reason*

All three constructors contain this line:

```python
self._model = model
```

It looks like duplication. Base classes do hold shared code sometimes, so how do you tell when?

In plug terms: if every country's adapter had to contain *the exact same safety fuse*, you'd design that fuse into a shared base. If one country needed a different fuse, it would stop being shared.

So the test is: *would every subclass write this exact line, unchanged, for the same reason?*

`self._model = model` fails that test. Each provider stores a different company's model name, inside a constructor that otherwise looks nothing like the others. The lines only match by coincidence.

|  | Moved into the base class | Left in each subclass |
| --- | --- | --- |
| **Same for the same reason** | One place to change it | The same edit repeated, and copies slowly drift apart |
| **Same by coincidence** | Every future subclass inherits a rule it may not want | One boring repeated line |

The promise is finished, and it's small. Now we can come back to the one line we started with.

## 7\. The payoff: write the caller once

```python
def summarize(llm: BaseLLM, text: str) -> str:
    return llm.generate(f"Summarize in one sentence:\n\n{text}")

summarize(OpenAILLM(model=openai_model), article)
summarize(AnthropicLLM(model=claude_model), article)
summarize(OllamaLLM(model=local_model), article)
```

`llm.generate(...)` never changes, but what it does changes completely: it might call OpenAI, call Anthropic, or hit a server on my laptop. The object you pass in decides which. The caller doesn't.

Each line of the box above shows up in this function:

*   **Line 1** is why `summarize` has exactly one method to call.
    
*   **Line 2** is why a provider without `generate` can't even be created and passed in. A provider with the wrong signature still can be, though.
    
*   **Line 3** is why `summarize` never touches provider details, and also why each provider still needs one real request as a test.
    
*   **Line 4** is why `summarize` can't tell a real adapter from a `FakeLLM`, while you can, and why you know where the risk lives.
    
*   **Lines 5 and 6** are why adding `OllamaLLM` didn't change `summarize` or the other two providers.
    

Abstraction was the decision we made in sections 1 through 6. Polymorphism is what that decision gets us in this one function.

## The definitions, after all that

|  | What the tutorial said | What Phase 1 taught me |
| --- | --- | --- |
| **Abstraction** | Hide complexity, show only what's needed | A promise about what callers can depend on, kept as small as they need. Setup, SDK details and look-alike lines stay inside the classes. |
| **Polymorphism** | Many forms, one interface | One call in the caller works with any object that keeps the promise, and the object decides what happens. Python checks the name. Only running the code proves the rest. |

## Cheat sheet

| Concept | Rule of thumb | Where it shows up |
| --- | --- | --- |
| Abstraction | Callers depend on `BaseLLM`, never on a provider class | `mingraph/llm.py` |
| Abstraction | Each provider keeps its SDK details inside its own class | `mingraph/providers.py` |
| Enforcement | Python checks that the method name exists, not its signature | `@abstractmethod` |
| Where the risk is | An adapter faces an SDK you can't change; only a real request tests it | every `generate` body |
| Keeping it small | No base constructor; move code up only when it's there for the same reason | `BaseLLM` has no `__init__` |
| Polymorphism | One call, and the object decides what happens | `llm.generate(prompt)` |

## Next up: one string isn't a conversation

The promise has a gap: `generate` takes a single string. That leaves no way to send a system instruction or earlier turns of a conversation, so every adapter quietly wraps your string as one `user` message.

Phase 2 fixes that with proper message objects. Its theme is encapsulation, composition and dataclasses, and it starts from a question: what happens when two conversations share one message object and one of them changes it?

## Conclusion

The code for this phase is on the [phase-1 branch of mingraph](https://github.com/jairamshegde/mingraph/tree/phase-1). This post is part of the series LangGraph from Scratch: Design Patterns in Python.

Thank you for reading, see you in the next phase, bye.
