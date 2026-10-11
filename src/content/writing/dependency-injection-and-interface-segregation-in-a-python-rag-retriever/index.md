---
title: Dependency Injection and Interface Segregation in a Python RAG Retriever
subheading: 'LangGraph from Scratch, Phase 6: building the embedder, the vector store and the retriever as three separate pieces.'
description: 'LangGraph from Scratch, Phase 6: building the embedder, the vector store and the retriever as three separate pieces.'
date: 2026-10-11
tags:
  - RAG
  - LLM
  - python
  - oop
  - design-patterns
cover: phase_6_cover_image.png
featured: true
draft: false
---

> **In a hurry?**
> 
> *   **Dependency injection** means an object is handed the things it uses instead of creating them itself. My vector store is handed its embedding model. A test hands it a fake that returns numbers I picked, the live script hands it a real model, and the store's code is the same both times.
>     
> *   Swapping takes two things. Many classes have to fit the same interface, which is old news. And something has to *choose* which one goes in. Injection moves that choice out of the class and up to the line that builds it.
>     
> *   **Interface segregation** means each caller gets only the calls it uses. The pipeline step that fetches documents is handed a retriever with one method, `invoke(query)`. It never holds the store, so it has no way to add or change what's stored.
>     
> *   Three jobs, three interfaces: an embedding model turns text into numbers, a vector store keeps and searches those numbers, and a retriever returns documents for a question. LangChain splits RAG the same way.
>     

## The textbook version of both ideas

Here's how Wikipedia defines the first one:

> Dependency injection is a programming technique in which an object or function receives other objects or functions that it requires, as opposed to creating them internally.

And the second, credited to Robert C. Martin:

> No code should be forced to depend on methods it does not use.

The tutorials I learned these from looked something like this (an illustration, not from the repo):

```python
class Car:
    def __init__(self, engine):      # handed an engine instead of building one
        self.engine = engine

car = Car(PetrolEngine())
```

For the second idea, the example was usually a `Machine` interface with `print`, `scan` and `fax`, and an old printer forced to write a `fax` method that raises an error.

Neither one ever clicked for me. The car always got a petrol engine. Nobody ever handed it anything else, so passing the engine in looked like extra typing. And the printer's `fax` raised an error, nobody called it, and nothing broke. I couldn't see the moment where doing it the other way would actually hurt.

## How you probably write RAG today

If you've built RAG with LangChain, you've written some version of these four lines (an illustration of the usual pattern, not run for this post):

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = InMemoryVectorStore(embeddings)
vector_store.add_documents(docs)
retriever = vector_store.as_retriever(search_kwargs={"k": 2})
```

Then the retriever goes into a chain, the chain fills a prompt, and the model answers from your documents instead of guessing. Here's what that buys, from the `mingraph` version of the same thing. Same model (`gpt-4o-mini`), same question, asked once on its own and once with two recipe cards found and pasted into the prompt first:

```plaintext
question:      How many whistles for Jairam's dal?

without cards: ...Generally, for most types of dal, cooking it for about 3 to 4
               whistles is sufficient. However, some dals might require more time...
with cards:    3 whistles.
```

Without the cards it hedges with a general rule. With them it gives the number from my family's recipe.

The picture I'll use for the rest of this post is a kitchen. The model is a cook who learned a huge number of recipes during training, and then training stopped. They've never seen my family's dal recipe. The counter they work at (the prompt) is small, so I can't pile the whole cookbook shelf on it. Before the cook starts, a helper goes to the shelf, picks the few cards that match today's order, and puts only those on the counter.

How does the helper find the right cards? There's a big board on the kitchen wall, and every recipe card is pinned on it at a spot based on what the card is about. A pin-maker decides where each card goes. Mapped onto the four lines above:

*   the pin-maker is the embedding model (`OpenAIEmbeddings`)
    
*   the board is the vector store
    
*   the helper is the retriever
    
*   the cards are the documents
    

I'd written those four lines many times without asking two questions. Why does the store take the embedding model as an argument? And why does `as_retriever` exist, when the store can already search?

## Then I had to write a test for it

Phase 6 of [mingraph](https://github.com/jairamshegde/mingraph), my from-scratch rebuild of LangGraph, was building those pieces myself. The roadmap's "done when" had two lines:

1.  The same retriever works with a fake embedder and a real one, and swapping them touches no calling code.
    
2.  A test asserts the exact order the cards come back in.
    

The second line is where I got stuck. Which order? I ran five recipe cards through `qwen3-embedding:0.6b` on Ollama, asked "How long do I cook the dal?", and printed the top three:

```plaintext
1. Jairam's dal: 1 cup toor...
2. Rajma: soak overnight...
3. Which dal to use for tadka...
```

Dal first is right. But should rajma be second? I only knew that order after running it.

Could a test assert it? It could, and it would be asserting a guess about the inside of a neural network. When I changed one setting on the model, places 2 and 3 swapped. A test pinned to that order would break the day someone changed a setting or upgraded the model, and the code under test would be fine the whole time.

A test can only know the right order in advance if I choose the numbers. So I needed a pin-maker that returns numbers I wrote by hand, and a board that takes that fake in a test and the real model in the real kitchen. I also needed a pipeline step that asks for cards and can't do anything else to the board.

Put plainly: the board had to be handed its pin-maker instead of picking one, and the step that asks for cards had to be handed something smaller than the whole board.

## To fake the pin-maker, I had to know what it makes

A fake has to return the same kind of thing the real one does. So the first job was to understand what the real one returns.

Here's the question and the card that answers it:

```plaintext
question: How long do I cook the dal?
card:     Jairam's dal: 1 cup toor, pressure cook for 3 whistles, then tadka...
```

The question asks *how long*. The card answers *3 whistles*. The part that answers shares no words with the question, so searching by words can't connect them.

The board doesn't compare words. It compares spots. Picture a map where dal cards sit in one corner, desserts far away in another, and cards about cooking times sit close together inside the dal corner. The question gets pinned on the same map by the same rules, and lands next to the "3 whistles" card. An embedding model is what turns a text into its spot, and the spot is just a list of numbers, the way a map pin is (x, y). That list is called a vector.

The real model uses 1024 numbers, and nobody chose what any single number means. The model learned them. For my fake I used two numbers, *how much is this about dal* and *how much is it about timing*, and picked them by hand. These are from the test file:

```python
pins = {
    DAL:      [0.9, 0.8],   # dal, timing
    RAJMA:    [0.6, 0.9],   # lentil-ish, timing
    JAMUN:    [0.0, 0.3],   # dessert
    QUESTION: [0.8, 0.9],
}
```

Then the board needs a rule for **nearest**. My first thought was a ruler: measure the distance between two spots and pick the shortest. LangChain's `InMemoryVectorStore` does something else. It uses cosine similarity. Draw each spot as an arrow from the centre of the map. Cosine ignores how long the arrows are and only asks whether they point the same way. Same direction scores 1, a right angle scores 0.

Does that ever give a different answer from the ruler? Before you read on, guess which of these two cards wins against a question at `[0.9, 0.8]`:

| Card | Vector | Distance from the question | Cosine |
| --- | --- | --- | --- |
| "same way" | `[0.45, 0.4]` | 0.60 | 1.000 |
| "near" | `[0.8, 1.0]` | 0.22 | 0.986 |

The ruler picks "near". Cosine picks "same way", because it points exactly where the question does, just half as far. I wrote a test that asserts `["same way", "near"]`, and it passes.

How much does that matter for a real model? Every Qwen vector I measured had a length of exactly 1.0, at 1024 numbers and at 384. When all the arrows are the same length, the ruler and cosine always agree on the order. So the case where they disagree came only from my fake. Cosine is still the safe choice, since it gives the right order whatever lengths an embedder returns.

The search itself is short. Score every stored card against the question, sort, take the top `k`:

```python
def similarity_search(self, query: str, k: int) -> list[Document]:
    q = self._embedder.embed_query(query)
    ranked = sorted(self._entries, key=lambda entry: _cosine(q, entry[1]), reverse=True)
    return [doc for doc, _ in ranked[:k]]
```

With the hand-picked pins, I know the answer before running it: dal 0.993, rajma 0.990, gulab jamun 0.747. That's an order a test can assert. All the fake needed now was a way onto the board.

## Who puts the pin-maker on the board?

Notice the first line of that search: `self._embedder`. The board uses a pin-maker every time a question comes in, and every time a card goes up. Where does `self._embedder` come from?

Here are two ways to write the store's constructor. The first is an illustration, it was never in the repo:

```python
# The board chooses its pin-maker
class InMemoryVectorStore:
    def __init__(self):
        self._embedder = OllamaEmbedder("qwen3-embedding:0.6b")

# Whoever builds the board chooses
class InMemoryVectorStore:
    def __init__(self, embedder: Embeddings):
        self._embedder = embedder
```

Which one lets the test use the fake?

In the first, the pin-maker is bolted into the board's frame. Every board ever made gets Qwen, and the test would have to open the class up to change that. In the second, the board has an empty slot. It never picks what goes in. It keeps whatever it's handed and says "pin-maker, give me the spot for this text".

So the choice moves up one level, to the line that builds the board. To check that, I wrote two small functions and never touched them again:

```python
def build(embedder):            # the only place an embedder is chosen
    store = InMemoryVectorStore(embedder)
    store.add_documents([Document(card) for card in CARDS])
    return VectorStoreRetriever(store, k=3)

def ask(retriever, question):   # the call site
    return [doc.page_content[:40] for doc in retriever.invoke(question)]
```

I passed `build` four pin-makers: the fake, and Qwen in three different setups. Neither function changed, and all four put the dal card first. The test with the fake asserts the exact order (dal, rajma, gulab jamun) and passes. Both lines of the roadmap's "done when" came from the same constructor.

This is **dependency injection**: an object is handed what it depends on instead of building it. And I'd already been doing it without the name. In phase 4, `Summarise(llm=...)` was handed its model. In phase 5, `CallModel(llm=...)` was too, which is how a test there ran with a fake model. The LangChain line `InMemoryVectorStore(embeddings)` is the same move. I'd typed it for months.

Phase 1 gave me "many things fit the slot": every model wrapper answers the same `generate` call. That was never enough on its own, because someone still has to put one thing in the slot. If the class does it, the slot might as well be welded shut. The car tutorial never showed this because the car only ever got one engine. My board needed two pin-makers, and the test couldn't exist without the second one.

There was a loose end, though. The board isn't the only thing that could hold a pin-maker.

## Two places could hold the pin-maker

The pin-maker gets used twice: once to pin the cards when they go up, and once to pin each question. So it could reasonably live in the store or in the retriever. Here are both shapes:

```python
# A: the store holds the pin-maker (what LangChain does)
store = InMemoryVectorStore(embedder)
store.add_documents(docs)                                  # store pins the cards
retriever = VectorStoreRetriever(store, k=3)               # never sees a pin-maker

# B: the store only holds numbers
store = InMemoryVectorStore()
store.add(docs, vectors=embedder.embed_documents(texts))   # setup code pins the cards
retriever = VectorStoreRetriever(store, embedder, k=3)     # retriever pins the question
```

B is an illustration, and at first it looked cleaner to me. The store would be pure storage that knows nothing about text.

But in B, two different lines each pick a pin-maker. What happens if they pick different ones? I ran the mix-ups on purpose:

```plaintext
1024-number question vs 384-number card:    ValueError: zip() argument 2 is shorter than argument 1
hand-made 384 vector vs Qwen 384 card:      -0.086
Qwen question vs Qwen card (same embedder): 0.708
```

The first one fails loudly, but only because my cosine function uses `zip(..., strict=True)`. A plain `zip` would quietly compare the first 384 numbers and return a score.

The second is the dangerous one. Same length, no error, and a number that looks exactly like a score. It just means nothing. Every pin-maker draws its own map, and a pin only means something on the map it was made for. A store mixing two of them would hand back cards in an order that looks reasonable and is random. (I mixed in a hand-made vector here, not a second real model, so I haven't seen two real models collide. Nothing in the numbers says which map they came from either way.)

So the rule "every vector in a store comes from one pin-maker" can't be checked by looking at the vectors. The only way to keep it is to make breaking it impossible, and that's shape A. The store holds the one pin-maker and uses it for both jobs:

```python
def add_documents(self, docs: list[Document]) -> None:
    vectors = self._embedder.embed_documents([doc.page_content for doc in docs])
    ...

def similarity_search(self, query: str, k: int) -> list[Document]:
    q = self._embedder.embed_query(query)
    ...
```

There's no second line where a different pin-maker could slip in. It's the same move as phase 4, where "one system message, and it comes first" was kept by putting it in the constructor so there was no way to add a second.

Look at those two calls again, though. Cards go through `embed_documents` and questions go through `embed_query`. My fake does exactly the same thing in both. Why does the slot have two calls?

## Some models treat a question differently from a card

LangChain's `Embeddings` base class has the same two methods. The reason showed up in the model card for Qwen3-Embedding, the model I was using: each question should come with a one-line instruction describing the task, and cards need none.

In the kitchen, that's a note handed to the pin-maker along with the question: "this is a question, pin it where its answer would be". Cards are pinned by what they say.

This is where the two methods earn their place. With a single `embed(text)`, the pin-maker can't tell a card from a question. So the note would have to be added by whoever calls it, most likely the retriever. Then the retriever would be doing Qwen-specific work, and swapping in another model would mean changing the retriever. With two methods, the note stays inside the Ollama adapter (the class that translates mingraph's calls into Ollama's API):

```python
class OllamaEmbedder(Embeddings):
    def __init__(self, model, dimensions=None, query_prefix="", host="http://localhost:11434"): ...

    def embed_documents(self, texts):
        return self._embed(texts)                           # cards, unchanged

    def embed_query(self, text):
        return self._embed([self._query_prefix + text])[0]  # question, with the note
```

The note's wording differs from model to model, and the vector length (`dimensions`) is something only some models let you choose. Both are settings only some models have, so they go in this adapter's constructor and never in the shared interface. That's the rule from phase 1, where settings the providers disagreed on stayed out of the base class.

So the pin-maker carries its own quirks, and the board holds the pin-maker. That left the retriever with very little to do.

## The retriever came out one line long

Here's the whole retriever:

```python
class VectorStoreRetriever(Retriever):
    def __init__(self, store: VectorStore, k: int = 4):
        self._store = store
        self._k = k

    def invoke(self, query: str) -> list[Document]:
        return self._store.similarity_search(query, self._k)
```

One line of real work, and it passes the call straight to the store. My first reaction was that this class shouldn't exist. Why not hand the pipeline step the store, and call `similarity_search` there? Less code, one less name.

What would you lose by skipping it?

Think about the cook. All they ever need is "bring me the cards for this order". The board can do more than that: put cards up, and find the nearest. If the cook were handed the whole board, they could pin a card mid-service by accident. So the cook isn't handed the board. They talk to a helper who takes exactly one request.

Here's what each side can call:

```python
store.add_documents(docs)            # setup work, done once
store.similarity_search(query, k)

retriever.invoke(query)              # the step's whole menu
```

The pipeline step is handed a retriever, so adding documents isn't something it can even reach:

```python
>>> hasattr(VectorStoreRetriever(store, 2), "add_documents")
False
```

The step can't change the store. It never promised not to; it was never given a way to.

There's a second thing the small menu buys. LangChain's retriever docs say a retriever "does not need to be able to store documents, only to return (or retrieve) them". The step depends on "documents for a question", not on vectors. A retriever that searched by keyword, or called a web search, would fit the same slot. I haven't built one, but nothing in the step would change if I did.

Even `k`, the number of cards, is fixed when the retriever is built rather than passed to `invoke`. The step just asks, and setup decides how many come back. Every piece was ready to go into a pipeline.

## The whole pipeline, written once

In phase 5, mingraph got steps: small objects that each read from one shared dict (the state) and return only the keys they set, and a `Sequence` that runs steps in order. RAG needed two new steps and two old ones. Here's the caller, trimmed from `04_live_rag.py`:

```python
embedder = OllamaEmbedder("qwen3-embedding:0.6b", dimensions=384, query_prefix=QWEN_NOTE)
store = InMemoryVectorStore(embedder)
store.add_documents([Document(card, {"source": "family_recipes.txt"}) for card in CARDS])

rag = Sequence([
    Retrieve(VectorStoreRetriever(store, k=2), read="question", write="docs"),
    FormatDocs(read="docs", write="context"),
    Prompt(template),
    CallModel(OpenAILLM("gpt-4o-mini"), write="answer"),
])
out = rag.run({"question": "How many whistles for Jairam's dal?"})
```

And what it printed:

```plaintext
cards found: [("Jairam's dal: 1 cup toor, pres", 'family_recipes.txt'), ('Rajma: soak overnight, pressur', 'family_recipes.txt')]
with cards:   3 whistles.
```

Every earlier section shows up somewhere in those lines:

*   Line 1 is the only place Qwen is named. The question's note and the vector length are its settings, and nothing after it knows they exist.
    
*   Line 2 is the empty slot. Hand it the fake instead and every line below stays the same, which is exactly what the test does.
    
*   Line 3 goes through the store's one pin-maker, so the cards and the question are pinned on the same map.
    
*   `Retrieve` holds a retriever, not the store. It can ask for cards and do nothing else.
    
*   `FormatDocs` turns the cards into plain text for the prompt. Without it, `Prompt` would paste the list's raw Python printout into the template, the same trap phase 5's `Text` step fixed. The cards stay in the state with their `source`, for anything later that wants to cite them.
    

That last idea in the list has a name too. Giving each caller only the calls it uses is **interface segregation**. It's why there are three interfaces here instead of one big "RAG thing": `Embeddings` for whoever needs numbers, `VectorStore` for setup code, and `Retriever` for the step. LangChain's Retrieval page draws the same three lines.

|  | The tutorial version | What this phase taught me |
| --- | --- | --- |
| Dependency injection | "Receives the objects it requires, instead of creating them" | The point is *who chooses*. With two pin-makers to pick from, the class that chooses can't be tested, and the class that's handed one can |
| What made it worth it | A car that only ever gets one engine | A test that has to know the answer in advance, which only a fake can give |
| Where the dependency lives | Wherever it's needed | In one place, when a rule ("one map per board") can't be checked from the data |
| Interface segregation | A printer that can't fax | A step that can't change the store, because it never holds the store |
| A one-line pass-through class | Wasted code | A smaller menu, and a slot a non-vector retriever could fit |

Back to the two questions I'd never asked about those four LangChain lines. The store takes the embedding model as an argument so whoever builds it can choose, and so cards and questions can never be pinned by two different models. `as_retriever` exists so the code asking for documents gets a smaller menu than the code that loads them.

## A real file, and a ruler that cut in the wrong place

Hand-written cards are easy. Real material comes as a file, so the last thing I built was a splitter. It reads a file and cuts it into strips, and each strip becomes its own card. Pinned whole, a file about four recipes lands in the middle of all four, close to none of them.

The roadmap allowed only the simplest cut: every 200 characters, with 40 repeated between neighbours so a sentence cut at one edge shows up more complete in the next strip. I ran a four-recipe file (869 characters, 6 strips) through the same pipeline:

```plaintext
How many whistles for the dal?   -> The dal should be pressure cooked for 3 whistles.
How long does jeera rice rest?   -> Jeera rice rests for 5 minutes.
How long do gulab jamuns soak?   -> The recipe notes do not specify how long gulab jamuns soak.
```

The file does say: "soak them in warm sugar syrup with cardamom for at least two hours". The cut put "Gulab jamun." at the end of strip 2 and the soak time in strip 3, about 150 characters apart, more than the 40 that repeat. Strip 3 never names the dish. It says "them". Its pin landed where its words belonged, near frying and syrup, and it scored 0.490, fourth of six. With `k=2` it never reached the prompt. The prompt's "if they don't say, say so" is what let me tell that the miss was in finding, not answering.

I left the splitter as it is and kept the failure as a result. It's a plain function, not a class behind an interface, because there's only one kind and nothing swaps it. A second way of cutting text (one that keeps paragraphs whole, which LangChain suggests starting with) is what would turn it into an interface. That's on the backlog.

What's next is about the pipeline itself. It always does the same thing: retrieve once, fill the prompt, call the model, stop. It can't look again when the cards don't answer the question, or decide that this question needs a tool instead. In phase 7 the model starts deciding what happens next, which means an agent loop: the State pattern for the loop's phases, and Observer so you can watch it run.

*   Code for this phase: [mingraph, phase-6 branch](https://github.com/jairamshegde/mingraph/tree/phase-6)
    
*   [LangChain: Retrieval](https://docs.langchain.com/oss/python/langchain/retrieval)
    
*   [LangChain: Vector stores](https://docs.langchain.com/oss/python/integrations/vectorstores)
    
*   [LangChain: Retrievers](https://docs.langchain.com/oss/python/integrations/retrievers)
    
*   [LangChain: Text splitters](https://docs.langchain.com/oss/python/integrations/splitters)
    
*   [Qwen3-Embedding-0.6B model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)
    
*   Wikipedia: [Dependency injection](https://en.wikipedia.org/wiki/Dependency_injection), [Interface segregation principle](https://en.wikipedia.org/wiki/Interface_segregation_principle)
    

Thankyou for reading 🙂, see you in the next phase ✌️
