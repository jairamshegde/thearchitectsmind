---
title: What Encapsulation Actually Buys You
subheading: 'LangGraph from Scratch, Phase 2: not hidden data, but checks you never have to write twice'
description: 'LangGraph from Scratch, Phase 2: not hidden data, but checks you never have to write twice'
date: 2026-10-11
tags:
  - python
  - oop
  - dataclass
  - LLM
  - langchain
cover: phase_2_cover_image.png
featured: false
draft: false
---

> **In a hurry? Here's the whole post.**
> 
> *   **Encapsulation isn't hiding data.** It's an object taking responsibility for its own rules, so nothing downstream has to check them again.
>     
> *   **There are two moments to get right, not one.** The moment the object is made, and every moment after it. In Python, an underscore covers neither.
>     
> *   **A frozen dataclass with a** `__post_init__` **check covers both.** Someone determined can still force a change, and that's fine, because nobody does it by accident.
>     
> *   **It matters because a list holds a link, not a copy.** The same message sits in several conversations at once, and only an unchangeable one is safe to share that way.
>     
> *   **A rule belongs to whoever still has the knowledge to check it.** The model can't see a blank you forgot to fill, so the template has to refuse.
>     
> *   **Composition is holding, not being.** A conversation holds messages but isn't one. And a whole only earns its own class once it has a rule of its own to enforce.
>     

You've probably seen this one:

```python
class BankAccount:
    def __init__(self):
        self.__balance = 0

    def get_balance(self):
        return self.__balance
```

*   **Encapsulation**: bundle data with the methods that use it, and hide the internal state.
    
*   **Composition**: a "has-a" relationship, like a `Car` that has an `Engine`, as opposed to inheritance's "is-a".
    

> Put underscores in front of things. Say "has-a" when someone asks about composition. Neither habit ever told me what to build.

## *The problem: one string isn't a conversation*

Phase 1 ended with one promise: `generate(prompt: str) -> str`. Three adapters sat under it, for OpenAI, Anthropic and Ollama.

A single string can't carry "answer in one word" as an instruction. It can't carry what was said two turns ago either. Real chat APIs take a list of role-tagged messages. [LangChain calls messages the fundamental unit of context for model](https://docs.langchain.com/oss/python/langchain/messages)s.

So what was a message in my code at that point? It was sitting in all three adapters as a plain dict:

```python
messages=[{"role": "user", "content": prompt}]
```

Turns out that I'd need a lot more of them now: a system message, the whole history, the new question, on every call.

What I wanted was two things. A message that can't exist in a broken state. And something that holds a bunch of them in order, without breaking any of them.

Here's the picture I kept in my head this phase, and it's paperwork, not code. **Everything in this post is a document: something you fill in, send, and then can't take back.**

*   **A filled-in form** is a message.
    
*   **Sending it as a PDF instead of a shared doc** is what makes it safe to pass around.
    
*   **A folder** is anything that holds a few of them in order, like a conversation.
    

That leads to the first question

## *1\. What's wrong with a dict? Nothing is responsible for it*

Before reading on, guess. What happens here?

```python
{"role": "usr", "content": "hi"}
```

Nothing. The dict holds `"usr"` happily. It would travel through the adapter and out over the network, and only the provider would reject it.

A dict is a blank sheet of paper with two words written on it by hand. Nothing on that sheet was required, and nothing about it was ever checked. You find out at the far end, when someone tries to process it.

My working definition of **encapsulation was hide the attributes**. So my first thought was to hide `role` behind an underscore.

The problem was never that someone could see the `role`. The real problem was that nothing was responsible for making sure the `role` was valid.

For example, the rule that `role` must always be one of `system`, `user`, or `assistant` is called an **invariant,** a rule that must always stay true.

Once I understood this, encapsulation became clearer to me: **encapsulation means an object is responsible for keeping its own rules valid.** It protects those rules instead of simply hiding them. So a message should check its own role. And that leads to next question.

## *2\. Is a check at creation enough? No, there are two moments*

Here's the obvious first version, a plain class that checks in `__init__`:

```python
class Message:
    def __init__(self, role, content):
        if role not in {"system", "user", "assistant"}:
            raise ValueError(f"unknown role {role!r}")
        self.role = role
        self.content = content
```

```plaintext
Message('usr', 'hi')   ->  REFUSED: ValueError: unknown role 'usr'
m.role = 'purple'      ->  {'role': 'purple', 'content': 'hi'}
```

Refused at creation. Then changed to "purple" one line later, without a word. Assigning to an attribute never goes back through `__init__`.

I wanted to know if this was just my naive version, so I tried LangChain's own `HumanMessage` (`langchain_core` 1.0.0):

```plaintext
HumanMessage(content='hi', type='usr')   ->  REFUSED: ValidationError
h.type = 'purple'                        ->  type is now 'purple'
```

Same shape. LangChain's messages are Pydantic models, and Pydantic checks on creation but, by default, \[not on assignment\](https://pydantic.dev/docs/validation/latest/api/pydantic/con \[not on assignment\]fig) `validate_assignment` is `False`).

> Plainly: *Nothing in Python makes it possible to enforce data hiding.* An underscore is a "please don't edit this" line typed at the top of the page.

Real question is how to make editing forbidden or make the object immutable?

## *3\. Does* `frozen=True` *finish the job? It stops typos, not forgery*

The roadmap put dataclasses in this phase for exactly this. A dataclass is the printed form itself. You write down which fields exist, and Python prints all the standard parts around them.

First, guess: do two identical messages compare equal?

```plaintext
plain printed:      <__main__.PlainMessage object at 0x102a53770>
dataclass printed:  DataMessage(role='user', content='hi')
plain equal?        False
dataclass equal?    True
```

The printing I expected. The equality I didn't. A plain class compares like "is this the very same sheet of paper?" A dataclass compares what's written in the fields, so two forms filled in identically count as equal.

The form also has a "send as PDF" box, `frozen=True`:

```plaintext
m.role = 'purple'  ->  REFUSED: FrozenInstanceError: cannot assign to field 'role'
```

`role: str` is a printed label next to the box, not a check on what goes in it. The [dataclass docs](https://docs.python.org/3/library/dataclasses.html) say *nothing in* `@dataclass` *examines the type specified in the variable annotation* The fix is `__post_init__`, which runs right after the fields are filled in.

**A PDF can still contain a link.** `frozen` stops a field from pointing somewhere new. It doesn't stop the thing it points at from changing:

```plaintext
b.content = ['bye']             ->  REFUSED
b.content.append('sneaked in')  ->  content=['hi', 'sneaked in']
```

A string can't change at all, so `content: str` has no link to follow.

Here's mingraph's message, with each gap answered:

```python
@dataclass(frozen=True)
class Message:
    role: Role
    content: str

    def __post_init__(self):
        if self.role not in get_args(Role):
            raise ValueError(f"role must be one of {get_args(Role)}, got {self.role!r}")
        if not isinstance(self.content, str):
            raise TypeError(f"content must be str, got {type(self.content).__name__}")
```

`__post_init__` is the check on submission. Nothing can point anywhere, because content has to be a string and the type check enforces that. The forgery I accepted: nothing in Python can stop it, and it can't happen by mistake.

```plaintext
Message("usr", "hi")   ->  ValueError: role must be one of ('system', 'user', 'assistant'), got 'usr'
Message("user", 123)   ->  TypeError: content must be str, got int
```

> The "usr" typo from section 1 now fails on the line that makes the message, not at the provider.

## *4\. Why lock it, when LangChain doesn't? Because a list holds a link*

Here's the experiment. One message goes into two histories, and I change it through the first one:

```plaintext
--- LangChain HumanMessage shared by two lists ---
lc_b now sees: changed via lc_a
```

I never touched `lc_b`.

A Python list doesn't hold the message. It holds a link to it. Two lists can hold a link to the same one, and editing through either link changes what both of them show.

Same test, with mingraph's message:

```plaintext
--- mingraph Message shared by two lists ---
same object in both lists? True
change through history_a: FrozenInstanceError
history_b still sees: hi
```

The aliasing is identical. The difference is that there's nothing to edit at the other end of the link. Send a PDF and it stops mattering how many places link to it.

And sharing isn't an edge case in LLM code. The same messages go out on turn 1, then again on turn 2, and one history often feeds several calls. That's the real reason mingraph's messages can't be changed when LangChain's can.

The first message I'd want to share is the model's own reply, going straight back into the history. **So what should** `generate` **hand back?**

## *5\. What should* `generate` *return? The letter, and the envelope it came in*

Phase 1 returned a `str`. That loses two things. A string can't go back into the conversation as the model's turn. And it drops what the provider says about the call: how many tokens, and why it stopped.

I checked what each installed SDK reports. All three report the same facts in different words:

|  | Input tokens | Output tokens | Finished | Hit the limit |
| --- | --- | --- | --- | --- |
| OpenAI | `prompt_tokens` | `completion_tokens` | `"stop"` | `"length"` |
| Anthropic | `input_tokens` | `output_tokens` | `"end_turn"` | `"max_tokens"` |
| Ollama | `prompt_eval_count` | `eval_count` | `"stop"` | `"length"` |

LangChain puts token counts on the message itself `AIMessage.usage_metadata`). I didn't, and the envelope is why. A letter arrives inside an envelope, and the envelope carries the postmark and the postage. You file the letter and bin the envelope. You don't file the envelope as though it were part of the letter.

The reply lives on in the conversation. The counts describe one delivery and then they're finished. When turn 1's reply goes back in on turn 2, turn 1's token count means nothing there. So the response *holds* both, side by side:

```python
@dataclass(frozen=True)
class LLMResponse:
    message: Message
    input_tokens: int | None
    output_tokens: int | None
    stop_reason: StopReason   # Literal["stop", "length", "other"]
```

Then the stop reason. If each provider's own word came through, a caller checking for a cut-off reply would need `"length"` for two providers and `"max_tokens"` for the third. The caller would have to know which provider it's talking to, which is exactly what phase 1's adapters exist to hide.

So each adapter owns the translation:

```python
_STOP_REASONS = {
    "end_turn": "stop",
    "stop_sequence": "stop",
    "max_tokens": "length",
    "model_context_window_exceeded": "length",
}
```

That's the Anthropic one. Anything unknown becomes `"other"`. A missing token count becomes `None`, not `0`, because a zero would be a fake measurement.

This is the same idea as the message, one layer out. The adapter is the post room, where everything foreign arrives. It sorts it once, so nothing further in has to.

What comes back is now clean. What goes *in* is still a list I build by hand on every call: system message, history, new question. **Who checks that?**

## 6\. Who catches a blank the model can't see? Only the template

A prompt template is a letter template with blanks in it.

*   Some of the wording is fixed and goes out every time, like the system message.
    
*   Some of it is a blank with a name next to it: `{question}`.
    
*   One part repeats: the history, however many earlier messages there are.
    

Before building mine, I tested LangChain's `ChatPromptTemplate` against the ways filling it can go wrong. The template was a system message `"You are a {persona}."`, a history slot, and `"{question}"`. Guess which of these fail:

```plaintext
question missing                 ->  KeyError: 'question'
extra tone="formal" passed       ->  OK, 'tone' just disappears
'Reply as JSON like {"answer": 1}.'  ->  input_variables: ['"answer"', 'question']
```

One fails and two don't. The missing question is caught, though a bare `KeyError` tells you only the name and nothing about what else the template wanted. The extra `tone` is dropped without a word, which is what a typo like `tnoe=` looks like from the outside. And the JSON example in a system message became a blank called `"answer"`, with no error at any point.

Then there's the history slot, which surprised me more than any of those. There are two ways to write it, and they don't agree:

```plaintext
("placeholder", "{history}")     history missing  ->  OK, no history, silently
MessagesPlaceholder("history")   history missing  ->  KeyError: 'history'
```

Same template, same missing value, opposite outcomes. The tuple form is the one LangChain's own reference shows, and it puts history in `optional_variables`, so leaving it out is fine and silent. `MessagesPlaceholder` puts it in `input_variables` and raises. There's also `MessagesPlaceholder("history", optional=True)`, which goes back to silent. Nothing about the shorter spelling says it turned the check off

My first question was: if a blank goes out unfilled, how would the model know? It wouldn't. I was mixing up two kinds of label:

*   **The role is a label the recipient reads.** It tells the model who said what, and it can't go missing, because a `Message` won't exist without one.
    
*   **The name next to a blank is only for whoever fills the form in.** It never goes out. The model receives the finished letter, not the template.
    

So if a blank goes out empty, the model gets `"You are a ."` and answers it anyway. **Only the template knows which blanks it was meant to fill, so only the template can refuse.** That turned "fail loudly" from a style preference into the only place the check can live.

mingraph's template is built from our own messages:

```python
template = ChatPromptTemplate([
    Message("system", "You are a {persona}. Answer in one short sentence."),
    MessagesPlaceholder("history"),
    Message("user", "{question}"),
])
```

Same four mistakes:

```plaintext
missing question  ->  ValueError: template expects ['history', 'persona', 'question']; missing ['question'], unknown []
extra tone        ->  ValueError: template expects ['history', 'persona', 'question']; missing [], unknown ['tone']
history forgotten ->  ValueError: template expects ['history', 'persona', 'question']; missing ['history'], unknown []
JSON braces       ->  ValueError: template variables must be plain names, got '"answer"' in 'Reply as JSON like {"answer": 1}.' (write literal braces as {{ and }})
```

One spelling, one behaviour. The JSON one fails when the template is *created*, not when it's filled, so a bad template can't sit in the codebase waiting. And every message names all three blanks it wanted, which is the part I actually use when something fails.

There's no optional form and no flag, so on the first turn you pass `history=[]` on purpose. "I know there's no history yet" and "I forgot" can't look the same in the code.

Why does the template return a list of messages and not one string? Here's what LangChain's template looks like flattened to a string:

```plaintext
System: You are a pirate.
Human: Hi, I'm Jai.
AI: Hello Jai!
Human: What's my name?
```

That's the whole thread pasted into one message body. It reads fine to you, but "System:" and "AI:" are now just words typed inside a single message from the user. The list keeps every message a real message, with its own label on it.

Every piece is built. Now let's write the code that uses all of them.

## 7\. The payoff: a caller that checks nothing

This is the usage example from the repo's README:

```python
def chat(llm: BaseLLM, questions: list[str]) -> None:
    history: list[Message] = []
    for question in questions:
        messages = template.format_messages(history=history, question=question)
        response = llm.generate(messages)
        print(f"{response.message.content}  [{response.stop_reason}, ...]")
        history += [messages[-1], response.message]

chat(OllamaLLM("qwen3.5:2b-q8_0"), ["Hi, I'm Jai.", "What's my name?"])
```

*(The template here has a fixed system message and no* `{persona}`*.)*

I ran it against a local 2B model while writing this post:

```plaintext
Hello Jai! How can I assist you today?  [stop, 34 in, 712 out]
Your name is Jai.  [stop, 60 in, 3158 out]
```

It answered the second question from the history, because that's the only place the name appears. Input tokens went from 34 to 60, because every call sends the whole conversation again. The output counts are mostly the model's hidden thinking: 3158 tokens to produce four words. The adapter keeps only the final text, but Ollama counts all of it.

Now look at what the function holds:

*   `history` **holds** messages.
    
*   `template` **holds** messages and a placeholder.
    
*   `response` **holds** a message and the delivery details.
    

None of them *is* a message. **This is composition.** One object holding finished parts, rather than being a kind of them.

Every line of the box shows up in `chat`:

*   **Lines 1 to 3** are why `chat` never validates a message. If `response.message` exists, it's a real assistant message. Nothing downstream re-checks it.
    
*   **Line 4** is why `history += [messages[-1], response.message]` is safe. That user message is now in both `messages` and `history`, and it doesn't matter, because nothing can change it. The adapters build new dicts from your messages and never touch your list either.
    
*   **Line 5** is why `response.stop_reason` means the same thing whichever `llm` you pass in, and why `response.message` goes straight into the history without dragging token counts along.
    
*   **Line 6** is why the first turn passes `history=[]` and a typo like `questoin=` fails before any request is sent.
    

And there's a question the code answers without ever stating it. `history` is a plain list. Why isn't there a `Conversation` class?

A list already holds things in order, for free. A class around it is only worth writing once it has a rule about the whole group, something like "the system message comes first". No single message can enforce that, because it doesn't know what else is in the list next to it. mingraph doesn't need that rule yet, so there's no class.

The template is the opposite case. It has rules about the whole thing, which blanks exist and which must be filled, so it earns its class. **A whole earns its own class once it has a rule of its own to enforce.** That's encapsulation again, one level up.

## 8\. So where does inheritance fit? It's the other question

Composition is easy to state and easy to mix up, because the definitions people hand you are "has-a" and "is-a", and both of those sound like descriptions of the same relationship.

Here's what phase 1 built, and it's the clearest contrast I have. `BaseLLM` declared one promise, `generate`. `OpenAILLM`, `AnthropicLLM` and `OllamaLLM` each inherited it and filled it in their own way. The `chat` function at the top of this section takes `llm: BaseLLM`, and any of the three can be handed to it.

That's the actual test, and it isn't about size or containment:

*   **Inheritance: can it stand in?** Wherever the code asks for a `BaseLLM`, an `OllamaLLM` will do. It keeps the whole promise and adds its own details underneath.
    
*   **Composition: does it hold one?** `LLMResponse` holds a `Message`. Hand an `LLMResponse` to something expecting a `Message` and it fails, even though the message is right there inside it.
    

"Bigger" has nothing to do with it. `LLMResponse` is bigger than a `Message` and can't stand in for one. `OllamaLLM` isn't bigger than `BaseLLM`, it's more specific, and it can.

In paperwork terms, it's the difference between a form and a folder. A scanned form and a typed form are both forms, and either one goes wherever a form is asked for. A folder holds forms and isn't one. Ask someone for a form and hand them a folder, and you've handed them the wrong thing.

Which is why phase 2 has almost no inheritance in it. Everything built here holds something: the response holds a message, the template holds messages, the history holds messages. Phase 1 was about one shape that several classes could fill. Phase 2 is about objects that hold parts they can trust. They're two different questions, and "has-a versus is-a" made them sound like one.

## The definitions, after all that

|  | What the tutorial said | What Phase 2 taught me |
| --- | --- | --- |
| **Encapsulation** | Bundle data with methods and hide the internal state | An object is responsible for its own rules, at two moments: checked when it's made, unchangeable after. Hiding was never the point. The adapters read `message.role` all the time. |
| **Composition** | "Has-a", like a car has an engine | One object holding finished parts it can trust. Inheritance is "can stand in for", not "bigger than". A whole earns its own class only once it has a rule of its own. |
| **Dataclasses** | Less boilerplate | A printed form: you write the fields, Python adds `__init__`, `__repr__` and `__eq__`. `frozen=True` stops edits after the fact. It never checks types, so `__post_init__` does. |

Back to `BankAccount`. It taught me to hide `__balance` behind a getter, which is the part that doesn't matter. The part that matters, "the balance can't go below zero", wasn't even in the example. And nothing ever shared an account or asked whether the car needed to exist. Once I had a message that gets shared across histories and a template that sees blanks the model can't, the definitions finally had something to hold on to.

## Cheat sheet

| Concept | Rule of thumb | Where it shows up |
| --- | --- | --- |
| Encapsulation | The object is responsible for its own rules, it doesn't hide its data | `Message.__post_init__` |
| Two moments | Check when it's made, refuse changes after | `@dataclass(frozen=True)` |
| Aliasing | A list holds links, so lock what gets shared | `history += [messages[-1], response.message]` |
| Check on arrival | Sort foreign data once, where it comes in | each adapter's `_STOP_REASONS` |
| Fail fast | Check where the knowledge is: only the template knows its blanks | `ChatPromptTemplate.format_messages` |
| Composition | Holding, not being; a class only once the whole has a rule | `LLMResponse`, `ChatPromptTemplate`, no `Conversation` |
| Inheritance | Can it stand in where the parent is asked for? | `OllamaLLM` passed as `BaseLLM` |

## Next up: a reply that isn't text

`generate` can now take a whole conversation. But a reply is still always text, and the content is always a plain string.

Phase 3 changes that. A model can be offered plain Python functions and reply with please call this one instead of text. Its theme is the Strategy pattern and a registry: interchangeable pieces of behaviour behind one shape, picked by name at runtime instead of by a growing `if` chain.

Thank you for reading 🙂, see you in the next post 👋

* * *

The code for this phase is on the [`phase-2` branch of mingraph](https://github.com/jairamshegde/mingraph/tree/phase-2).
