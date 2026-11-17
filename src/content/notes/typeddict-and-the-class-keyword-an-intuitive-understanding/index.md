---
title: 'TypedDict and the class keyword: An intuitive understanding'
date: 2026-11-17
tags:
  - langgraph
  - agent
  - state
  - dictionary
description: |-
  Why does `TypedDict` use Python's `class` keyword when it produces an ordinary dictionary rather than a conventional object?
  Explore the intuition behind Python's class declaration mechanism, dictionary schemas, and the role of `TypedDict` in defining structured data.
draft: false
---

While exploring LangGraph, I came across something interesting in its agent state declaration.

```python
from typing import TypedDict

class AgentState(TypedDict):
    question: str
    messages: list
    context: list[str]
    answer: str | None
```

At first glance, this looks like a typical Python class declaration. But something doesn't quite fit.

Where is the `__init__()` method? Where are the instance attributes? Are we creating an object or defining something else?

That curiosity led me to `TypedDict`.

### Not every class declaration creates a conventional object

In a regular Python class, we define how an object should behave and what attributes it should hold.

```python
class AgentState:
    def __init__(self, question: str):
        self.question = question
```

But `TypedDict` serves a different purpose.

It allows us to describe the expected structure of a dictionary: which keys should exist and what types of values they should contain.

Think of it as a blueprint for a dictionary, rather than a blueprint for an object with attributes and behaviour.

### But why use the `class` keyword?

This is the interesting part.

Python's `class` keyword is not exclusively for creating conventional object-oriented classes.

It provides a way to declare a class body. What happens with that declaration depends on the mechanism responsible for creating the class.

`TypedDict` uses a special metaclass to process the annotations and construct a dictionary-oriented type definition.

So, when we write:

```python
state = AgentState(
    question="What is RAG?",
    messages=[],
    context=[],
    answer=None
)

print(type(state))
```

The output is:

```text
<class 'dict'>
```

We get an ordinary Python dictionary, not a custom object instance.

### The mental model

Think about these three concepts:

- **Regular class:** Defines an object with attributes and behaviour.
- **Dataclass:** Defines a structured data-holding object with automatically generated methods.
- **TypedDict:** Describes the expected structure of a dictionary.

One important distinction: `TypedDict` provides static type information, not automatic runtime validation.

### The takeaway

The `class` keyword is a declaration mechanism. It doesn't always mean we're building a conventional object.

Sometimes, we're defining a type contract, a data structure, or an interface.

That small distinction makes Python's typing system a lot more interesting to explore.
