---
title: 'Mingraph : LangChain and LangGraph building blocks, rebuilt from scratch to learn object-oriented design and design patterns in Python.'
summary: 'mingraph follows the idea behind build-your-own-x: the best way to understand a technology is to rebuild it from scratch. Read the blog series from the link, it is getting small traction.'
stack:
  - python
  - oop
  - design-pattern
  - langchain
  - langgraph
date: 2026-10-11
links:
  repo: https://github.com/jairamshegde/mingraph
role: Senior AI Engineer
timeline: Sep - Oct 2026
problem: 'mingraph follows the idea behind build-your-own-x: the best way to understand a technology is to rebuild it from scratch. Here the goal is object-oriented design. Instead of studying patterns in isolation, each one is learned by rebuilding a LangChain/LangGraph piece that actually needs it, so every concept comes with a real problem it solves.'
lessons: To learn object-oriented design and design patterns in Python.
cover: Building Blocks of an AI System.png
featured: true
draft: false
---

mingraph is a learning project, not a library. Each phase takes one piece of the LangChain/LangGraph stack (provider wrappers, messages, tools, memory, steps, retrievers, the agent loop), rebuilds a minimal version of it, and uses it to practise one object-oriented idea or design pattern. The roadmap ends with a capstone: a tiny multi-agent graph orchestrator.

Design choices are checked against the official LangChain, LangGraph and provider documentation. The reasoning behind each phase, including what went wrong, is written up in the blog series below.

What it isn't: a replacement for LangChain or LangGraph, or production-ready code. The goal is to understand why those frameworks are shaped the way they are.

## Project structure

```txt
mingraph/
├── mingraph/
│   ├── __init__.py
│   ├── agents.py       # Agent loop, its State cards, and the Observer, ConsoleLogger and TraceRecorder listeners
│   ├── llm.py          # BaseLLM contract and the LLMResponse it returns
│   ├── memory.py       # Memory base and the KeepAll, LastN and Summarise strategies
│   ├── messages.py     # Sealed message types, one per kind of line, and ToolCall
│   ├── prompts.py      # ChatPromptTemplate and MessagesPlaceholder
│   ├── providers.py    # OpenAI, Anthropic and Ollama adapters, and the Ollama embedder
│   ├── retrievers.py   # Document, Embeddings, VectorStore, Retriever and split_text
│   ├── steps.py        # Step, the Sequence/Branch/Parallel containers, wrapper steps, Retrieve and Retry
│   └── tools.py        # Tool, read off a function, and ToolRegistry
├── requirements.txt    # pinned provider SDKs
├── LICENSE
└── README.md
```

## Installation

```bash
git clone https://github.com/jairamshegde/mingraph.git
cd mingraph
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
