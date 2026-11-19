---
title: My coding agent knew Pydantic. Now I do too.
description: 'LLM output keeps changing: extra keys, renamed fields, replies that come in two shapes, sources that turn into objects. Here’s the Pydantic feature that handles each one, plus how to turn your models back into clean JSON.'
date: 2026-11-20
tags:
  - pydantic
  - python
  - structured-output
  - LLM
  - agents
cover: Pydantic Lifecycle Pipeline.png
featured: false
draft: true
---

*Part 2 of 2. [Part 1](https://jairamhegde.in/writing/pydantic-validation-part-1/) builds `parse_answer` from scratch. Every example was run against Pydantic 2.14.1 on Python 3.14, and each code block runs on its own.*

## Where Part 1 ended

At the end of Part 1 I had a model and a function that handled the interview spec:

```python
from pydantic import BaseModel, Field, ValidationError


class InvalidLLMOutput(Exception):
    pass


class Answer(BaseModel):
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)


def parse_answer(raw: str) -> Answer:
    try:
        return Answer.model_validate_json(raw)
    except ValidationError as e:
        raise InvalidLLMOutput(str(e)) from e


print(parse_answer('{"answer": "Paris", "confidence": 0.92, "sources": ["doc1"]}'))
# answer='Paris' confidence=0.92 sources=['doc1']
```

It handles broken JSON, missing fields and out-of-range values. An LLM's output, though, changes whenever someone edits the prompt, swaps the model or adds a feature. So I listed the other ways an LLM's JSON can drift from the spec and ran each one against this model. Each drift led to a different part of Pydantic.

## Drift 1: the model adds a key you didn't ask for

Ask a model for three keys and sometimes you get four:

```python
from pydantic import BaseModel, Field


class Answer(BaseModel):
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)


raw = '{"answer": "Paris", "confidence": 0.92, "reasoning": "It is the capital."}'
print(Answer.model_validate_json(raw))
# answer='Paris' confidence=0.92 sources=[]
```

There's no error and no `reasoning` field. Pydantic dropped the key silently.

Pico: "Wait. Is silently dropping it what you wanted, or just what you got?"

It depends. `extra="ignore"` is the default, and for LLM output it's often right, because a harmless extra key shouldn't fail the whole response. But if an extra key means the prompt and the model have drifted apart, you want to know. `model_config` controls that:

```python
from pydantic import BaseModel, ConfigDict, Field, ValidationError


class Answer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)


raw = '{"answer": "Paris", "confidence": 0.92, "reasoning": "It is the capital."}'
try:
    Answer.model_validate_json(raw)
except ValidationError as e:
    print(e.errors()[0]["type"], e.errors()[0]["loc"])
# extra_forbidden ('reasoning',)
```

There's also `extra="allow"`, which keeps the unknown keys on the instance (you can read them from `model_extra`).

`model_config = ConfigDict(...)` is where every model-wide setting goes. It replaced the `class Config:` block from Pydantic v1. These are the settings I use:

| Setting | What it does | When I use it |
|---|---|---|
| `extra="forbid"` | Rejects unknown keys | Strict contracts, or catching prompt drift |
| `extra="ignore"` | Drops unknown keys (the default) | Lenient parsing of LLM output |
| `strict=True` | Turns off type conversion, so `"0.92"` no longer becomes `0.92` | When a quoted number signals a bad response |
| `str_strip_whitespace=True` | Strips spaces from every `str` field | LLM and form input |
| `validate_assignment=True` | Re-validates when you set an attribute after creation | Models you change after parsing |
| `frozen=True` | Makes instances read-only and hashable | Cache keys, shared state |
| `from_attributes=True` | Builds a model from an object's attributes (replaces v1's `orm_mode`) | SQLAlchemy rows |
| `alias_generator` | Generates aliases for every field, such as camelCase | APIs that use a different naming style |

Three of these change behavior you saw in Part 1, so they're worth running:

```python
from pydantic import BaseModel, ConfigDict, Field, ValidationError


class StrictAnswer(BaseModel):
    model_config = ConfigDict(strict=True)
    confidence: float


try:
    StrictAnswer.model_validate({"confidence": "0.92"})
except ValidationError as e:
    print("strict:", e.errors()[0]["type"])
# strict: float_type


class EditableAnswer(BaseModel):
    model_config = ConfigDict(validate_assignment=True, str_strip_whitespace=True)
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)


a = EditableAnswer(answer="  Paris  ", confidence=0.5)
print("stripped:", repr(a.answer))
try:
    a.confidence = 3
except ValidationError as e:
    print("assignment:", e.errors()[0]["type"])
# stripped: 'Paris'
# assignment: less_than_equal


class CacheKey(BaseModel):
    model_config = ConfigDict(frozen=True)
    prompt: str


key = CacheKey(prompt="capital of France")
print("hashable:", hash(key) == hash(CacheKey(prompt="capital of France")))
try:
    key.prompt = "something else"
except ValidationError as e:
    print("frozen:", e.errors()[0]["type"])
# hashable: True
# frozen: frozen_instance
```

Without `validate_assignment=True`, `a.confidence = 3` would succeed without complaint. Validation normally runs only once, when the instance is created.

## Drift 2: the key has a different name

A different model, or a prompt someone else wrote, returns `model_answer` instead of `answer`. You'd like to keep `answer` in your Python code. An alias maps one to the other:

```python
from pydantic import BaseModel, Field, ValidationError


class Answer(BaseModel):
    answer: str = Field(validation_alias="model_answer")


print(Answer.model_validate_json('{"model_answer": "Paris"}'))
# answer='Paris'

try:
    Answer.model_validate_json('{"answer": "Paris"}')
except ValidationError as e:
    print(e.errors()[0]["type"], e.errors()[0]["loc"])
# missing ('model_answer',)
```

Once you set an alias, the field name itself stops working for input. There are two ways to accept both names:

```python
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AnswerByName(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)
    answer: str = Field(validation_alias="model_answer")


class AnswerByChoices(BaseModel):
    answer: str = Field(validation_alias=AliasChoices("answer", "model_answer"))


print(AnswerByName.model_validate_json('{"answer": "Paris"}'))
print(AnswerByChoices.model_validate_json('{"model_answer": "Paris"}'))
# answer='Paris'
# answer='Paris'
```

`validate_by_name=True` was added in Pydantic 2.11. Older code uses `populate_by_name=True` for the same job, and it still works. `AliasChoices` accepts any name in its list, which helps when several models disagree.

Aliases also work in the other direction:

| Parameter | Applies to | Example use |
|---|---|---|
| `alias` | Input and output | One external name everywhere |
| `validation_alias` | Input only, and wins over `alias` | The LLM sends `model_answer` |
| `serialization_alias` | Output only, and wins over `alias` | Your API returns `score` instead of `confidence` |

```python
from pydantic import BaseModel, Field


class Answer(BaseModel):
    confidence: float = Field(serialization_alias="score")


a = Answer(confidence=0.9)
print(a.model_dump())
print(a.model_dump(by_alias=True))
# {'confidence': 0.9}
# {'score': 0.9}
```

The serialization alias only shows up when you pass `by_alias=True`.

## Drift 3: the reply can have two shapes

Next, the prompt says the model may refuse when the documents don't cover the question. Now a reply is either an answer or a refusal. The obvious type is a union:

```python
from typing import Literal, Union
from pydantic import BaseModel, ValidationError


class Answered(BaseModel):
    kind: Literal["answer"]
    answer: str
    confidence: float


class Refused(BaseModel):
    kind: Literal["refusal"]
    reason: str


class Reply(BaseModel):
    result: Union[Answered, Refused]


try:
    Reply.model_validate_json('{"result": {"kind": "refusal"}}')
except ValidationError as e:
    print(e.error_count())
    for err in e.errors():
        print(err["loc"], err["type"])
# 4
# ('result', 'Answered', 'kind') literal_error
# ('result', 'Answered', 'answer') missing
# ('result', 'Answered', 'confidence') missing
# ('result', 'Refused', 'reason') missing
```

The model said `"kind": "refusal"` and forgot the reason. That's one real mistake. Pydantic reports four errors, because it tried the reply against every member of the union and reports how each attempt failed.

Pico: "Three of those four errors are about a shape nobody sent."

The `kind` field already says which shape the model meant. A discriminator tells Pydantic to use it:

```python
from typing import Literal, Union
from pydantic import BaseModel, Field, ValidationError


class Answered(BaseModel):
    kind: Literal["answer"]
    answer: str
    confidence: float


class Refused(BaseModel):
    kind: Literal["refusal"]
    reason: str


class Reply(BaseModel):
    result: Union[Answered, Refused] = Field(discriminator="kind")


print(Reply.model_validate_json('{"result": {"kind": "refusal", "reason": "No document mentions it."}}'))
# result=Refused(kind='refusal', reason='No document mentions it.')

for raw in ['{"result": {"kind": "refusal"}}', '{"result": {"kind": "maybe"}}']:
    try:
        Reply.model_validate_json(raw)
    except ValidationError as e:
        for err in e.errors():
            print(err["loc"], err["type"])
# ('result', 'refusal', 'reason') missing
# ('result',) union_tag_invalid
```

Pydantic reads `kind` first and validates against that one model only. The error count drops to the one real problem, and an unknown tag gets its own error type. It's also faster, because Pydantic tries one member instead of all of them. Use a discriminated union whenever an LLM can return more than one shape, such as tool calls, answer or refusal, or different kinds of classification.

## Drift 4: the sources become objects

Plain document IDs aren't enough once you want to show citations. The prompt now asks for the ID and the quoted text. That makes a model inside a model:

```python
from pydantic import BaseModel, Field, ValidationError


class Citation(BaseModel):
    doc_id: str
    quote: str


class Answer(BaseModel):
    answer: str
    citations: list[Citation] = Field(default_factory=list)


a = Answer.model_validate_json(
    '{"answer": "Paris", "citations": [{"doc_id": "doc1", "quote": "Paris is the capital"}]}'
)
print(type(a.citations[0]).__name__)
# Citation

try:
    Answer.model_validate_json(
        '{"answer": "Paris", "citations": [{"doc_id": "doc1", "quote": "x"}, {"doc_id": "doc7"}]}'
    )
except ValidationError as e:
    print(e.errors()[0]["loc"], e.errors()[0]["type"])
# ('citations', 1, 'quote') missing
```

Pydantic validates nested models recursively and turns each dict into a `Citation`. The error `loc` points to the exact element, the second citation's `quote`. That path is what makes the retry prompt from Part 1 useful for nested output.

`list[str]` from Part 1 works the same way. Pydantic validates every element against the inner type, whether that type is `str` or a model.

## Going the other way: from model to JSON

Everything so far turns data into a model. The outgoing side matters when you log responses, return them from an API or store them.

```python
from datetime import datetime
from pydantic import BaseModel


class LoggedAnswer(BaseModel):
    answer: str
    confidence: float = 0.5
    note: str | None = None
    created: datetime


rec = LoggedAnswer(answer="Paris", created=datetime(2026, 10, 15, 9, 30))

print(rec.model_dump())
print(rec.model_dump(mode="json"))
print(rec.model_dump_json())
# {'answer': 'Paris', 'confidence': 0.5, 'note': None, 'created': datetime.datetime(2026, 10, 15, 9, 30)}
# {'answer': 'Paris', 'confidence': 0.5, 'note': None, 'created': '2026-10-15T09:30:00'}
# {"answer":"Paris","confidence":0.5,"note":null,"created":"2026-10-15T09:30:00"}
```

`model_dump()` keeps Python types like `datetime`, so the result may not be JSON-safe. `mode="json"` converts them to JSON-friendly values and still returns a dict. `model_dump_json()` goes straight to a string.

Three `exclude_` flags look alike, so I ran them side by side. In the second instance below, `confidence` is passed explicitly with the same value as the default:

```python
from datetime import datetime
from pydantic import BaseModel


class LoggedAnswer(BaseModel):
    answer: str
    confidence: float = 0.5
    note: str | None = None
    created: datetime


t = datetime(2026, 10, 15, 9, 30)
implicit = LoggedAnswer(answer="Paris", created=t)
explicit = LoggedAnswer(answer="Paris", confidence=0.5, created=t)

for name, rec in [("implicit", implicit), ("explicit", explicit)]:
    print(name, "exclude_none    ", list(rec.model_dump(exclude_none=True)))
    print(name, "exclude_unset   ", list(rec.model_dump(exclude_unset=True)))
    print(name, "exclude_defaults", list(rec.model_dump(exclude_defaults=True)))
# implicit exclude_none     ['answer', 'confidence', 'created']
# implicit exclude_unset    ['answer', 'created']
# implicit exclude_defaults ['answer', 'created']
# explicit exclude_none     ['answer', 'confidence', 'created']
# explicit exclude_unset    ['answer', 'confidence', 'created']
# explicit exclude_defaults ['answer', 'created']
```

`exclude_unset` asks what the caller actually sent, which is what a PATCH endpoint needs. `exclude_defaults` asks what differs from the defaults, which suits config diffs. `exclude_none` drops every `None`. They only disagree when a value is sent explicitly and equals the default, which is the `explicit` case above.

Pico: "Three flags that agree on every test case you'd think of first. Good luck in code review."

Some values belong in the output but shouldn't be input. Token usage is a good example, since the total comes from the other two:

```python
from pydantic import BaseModel, computed_field


class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int

    @computed_field
    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


print(Usage(prompt_tokens=120, completion_tokens=30).model_dump())
# {'prompt_tokens': 120, 'completion_tokens': 30, 'total_tokens': 150}
```

`@computed_field` puts the property into `model_dump()` and `model_dump_json()`. Use `functools.cached_property` instead of `property` if the value is expensive to compute.

The last outgoing method is the most useful one for GenAI work. `model_json_schema()` describes the model as JSON Schema, which you can paste into a prompt or pass to an LLM API's structured-output option:

```python
import json
from pydantic import BaseModel, Field


class Answer(BaseModel):
    answer: str = Field(description="The final answer, one short sentence")
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)


print(json.dumps(Answer.model_json_schema(), indent=2))
# {
#   "properties": {
#     "answer": {
#       "description": "The final answer, one short sentence",
#       "title": "Answer",
#       "type": "string"
#     },
#     "confidence": {
#       "maximum": 1.0,
#       "minimum": 0.0,
#       "title": "Confidence",
#       "type": "number"
#     },
#     "sources": {
#       "items": {
#         "type": "string"
#       },
#       "title": "Sources",
#       "type": "array"
#     }
#   },
#   "required": [
#     "answer",
#     "confidence"
#   ],
#   "title": "Answer",
#   "type": "object"
# }
```

The `ge`/`le` constraints became `minimum`/`maximum`, and `required` lists exactly the fields without defaults. One class now produces the instructions for the LLM and checks its reply. `description` text ends up in the schema, so write it for the model that will read it.

## Gotchas I hit or nearly hit

1. `Optional[X]` and `X | None` mean "may be `None`", not "may be omitted". Only a default makes a field optional to send.
2. `x: str = None` accepts an omitted field, because Pydantic doesn't validate defaults, but rejects an explicit `null`. Write `str | None = None`.
3. `Field(default=...)` isn't allowed inside `Annotated`. Write `score: Annotated[float, Field(ge=0)] = 0.5`.
4. `extra="ignore"` is the default, so unknown keys vanish without an error. Set `extra="forbid"` when you need to know.
5. Lax mode converts `"0.92"` into `0.92`. Set `strict=True`, on the model or with `Field(strict=True)`, when you don't want that.
6. `model_validate_json` reports bad JSON as a `ValidationError` of type `json_invalid`, not as `json.JSONDecodeError`. If you use `json.loads` and `model_validate` instead, catch both.
7. `ValidationError` and `json.JSONDecodeError` both subclass `ValueError`. A bare `except ValueError` catches them along with everything else.
8. Validation runs once, at creation. Changing an attribute later skips it unless `validate_assignment=True`.
9. A `before` validator runs ahead of type conversion and constraints. Its output still has to pass them.
10. Raise `ValueError` inside validators. Never raise `ValidationError` yourself.
11. A plain `Union` tries every member and reports every failure. Add a discriminator when the data carries a tag.
12. `exclude_unset` and `exclude_defaults` only differ when a value equal to the default was sent explicitly.

Pico: "Twelve gotchas, and every one of them passes the happy-path test."

## Pydantic vocabulary

Both posts use these terms. Most of them name a step in the lifecycle or a piece of the model, so here they are in one place, each with the code it refers to.

### The model and its parts

| Term | Meaning | In code |
|---|---|---|
| Model | A class that defines the structure and validation rules for data | `class Answer(BaseModel): ...` |
| Field | One declared piece of data in a model | `confidence: float` |
| Type annotation | The type a field must have | `: float`, `: list[str]` |
| Default | The value used when a field is left out. A field without one is required | `= 0.5`, `= Field(default_factory=list)` |
| Required | The input must include the field | `answer: str` |
| Nullable | The field accepts `None` | `note: str \| None` |
| Constraint | An extra rule on a field's value | `Field(ge=0.0, le=1.0)`, `Field(min_length=1)` |
| Nested model | A model used as a field's type inside another model | `citations: list[Citation]` |
| Model instance | An object created from the model after validation passes | `a = Answer(...)` |
| Attribute | How you read a field's value on an instance | `a.confidence` |
| Model configuration | Settings that apply to the whole model | `model_config = ConfigDict(extra="forbid")` |

### The lifecycle

| Term | Meaning | In code |
|---|---|---|
| Validation | Checking input against the model's rules, converting compatible values on the way | `Answer.model_validate(data)` |
| Deserialization | Turning incoming data (a dict or JSON string) into a model instance. In Pydantic, validation does this | `Answer.model_validate_json(raw)` |
| Serialization | Turning a model instance into outgoing data | `a.model_dump()`, `a.model_dump_json()` |
| Lax mode | The default. Pydantic converts values when nothing is lost, such as `"0.92"` to `0.92` | (default) |
| Strict mode | Type conversion is off, and the input must already have the right type | `ConfigDict(strict=True)` |
| `ValidationError` | The single exception holding every error from one validation run | `except ValidationError as e:` |

### Custom behavior

| Term | Meaning | In code |
|---|---|---|
| Field validator | Custom logic that checks or changes one field during validation | `@field_validator("x")` |
| Model validator | Custom logic that runs on the whole input or the finished instance | `@model_validator(mode="after")` |
| Before / after mode | Whether a validator runs on the raw input or on the converted value | `mode="before"`, `mode="after"` |
| Alias | Another name for a field on input, output or both | `Field(validation_alias="model_answer")` |
| Computed field | A property included in serialized output that isn't accepted as input | `@computed_field` |
| Serializer | Custom logic that controls how a value appears in output | `@field_serializer("x")` |
| Discriminated union | A field that can be one of several models, picked by a tag field | `Field(discriminator="kind")` |
| JSON Schema | A standard, machine-readable description of a JSON data contract | `Answer.model_json_schema()` |

You'll also hear people talk about a model's "shape". It's informal shorthand for the fields, their nesting and their types. It isn't a Pydantic API term.

The short version: a model defines the contract, fields describe its data, validation checks incoming values against the contract, and serialization prepares the data for output.

## Reference card

Everything from both posts in one model. It runs as written:

```python
from typing import Annotated, Literal, Self

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
    computed_field,
    field_validator,
    model_validator,
)


class InvalidLLMOutput(Exception):
    pass


class Citation(BaseModel):
    doc_id: Annotated[str, Field(pattern=r"^doc\d+$")]
    quote: str = Field(min_length=1)


class Answered(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    kind: Literal["answer"]
    # Required, accepts "answer" or "model_answer" as the key.
    answer: str = Field(min_length=1, validation_alias=AliasChoices("answer", "model_answer"))
    # Required and bounded. Dumped as "score" when by_alias=True.
    confidence: float = Field(ge=0.0, le=1.0, serialization_alias="score")
    # Optional to send, never None, safe mutable default.
    citations: list[Citation] = Field(default_factory=list)
    # Optional to send, may be None.
    note: str | None = None

    @field_validator("confidence", mode="before")
    @classmethod
    def percent_to_fraction(cls, v):
        if isinstance(v, str) and v.strip().endswith("%"):
            return float(v.strip().rstrip("%")) / 100
        return v

    @model_validator(mode="after")
    def confident_answers_need_citations(self) -> Self:
        if self.confidence >= 0.8 and not self.citations:
            raise ValueError("confidence >= 0.8 requires at least one citation")
        return self

    @computed_field
    @property
    def cited_docs(self) -> list[str]:
        return [c.doc_id for c in self.citations]


class Refused(BaseModel):
    kind: Literal["refusal"]
    reason: str


class Reply(BaseModel):
    result: Answered | Refused = Field(discriminator="kind")


def parse_reply(raw: str) -> Reply:
    try:
        return Reply.model_validate_json(raw)
    except ValidationError as e:
        raise InvalidLLMOutput(str(e)) from e


ok = parse_reply(
    '{"result": {"kind": "answer", "model_answer": " Paris ", "confidence": "92%",'
    ' "citations": [{"doc_id": "doc1", "quote": "Paris is the capital"}]}}'
)
print(ok.result.model_dump(by_alias=True))
# {'kind': 'answer', 'answer': 'Paris', 'score': 0.92, 'citations': [{'doc_id': 'doc1', 'quote': 'Paris is the capital'}], 'note': None, 'cited_docs': ['doc1']}

try:
    parse_reply('{"result": {"kind": "answer", "answer": "Paris", "confidence": 0.95}}')
except InvalidLLMOutput as e:
    print(e.__cause__.errors()[0]["msg"])
# Value error, confidence >= 0.8 requires at least one citation
```

## What I took from it

Every feature in this post exists because input changes after you write the parser. Extra keys, renamed keys, multiple shapes and nested objects are what happens when a prompt or a model changes under code that used to work. The interview tested the first day. These features matter on the hundredth.

The habit that helped most was the one from Part 1. Before reading about a feature, feed the model a bad input and look at what comes back. The error's `type` and `loc` usually tell you which feature you need.
