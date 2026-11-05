---
title: "Jairam Hegde"
welcome: "About"
lead: "I’m a GenAI engineer. I design and build agents, retrieval pipelines and the backend that keeps them running."
intro: "Jairam Hegde is a GenAI engineer who designs and builds agents and retrieval systems, and writes about the architecture underneath them."
now:
  - { label: "Building", value: "Mingraph, LangChain and LangGraph rebuilt from scratch" }
  - { label: "Writing", value: "The Mingraph series, one design pattern per phase" }
  - { label: "Reading", value: "An Illustrated Guide to AI Agents" }
  - { label: "Exploring", value: "Evals for multi-step agents" }
welcomeImage: pico-welcome.png
welcomeNote: "I’m Pico. I’m the one asking what happens when the API is down."
---

## What I build

GenAI systems that have to hold up outside a demo. That means agents that call tools, retrieval over real documents, and the evals and tracing that show whether a change helped.

Underneath sits ordinary backend work: APIs, queues, caches and vector stores. Most of what decides whether an AI feature stays up lives there.

**Usual stack.** Python, FastAPI, LangGraph, Qdrant, Redis, Celery, Supabase and Docker. I work with OpenAI, Anthropic, DeepSeek and local models through Ollama, often via Azure AI Foundry, and use Ragas, DeepEval and Arize Phoenix for evals and tracing.

## How I work

- **Keep the model's decisions small.** Control flow lives in plain code. The model makes narrow, typed choices, such as which tool to call and with what arguments. That is easier to test than a prompt that says "decide what to do next".
- **Measure before calling it better.** If an eval doesn't show that a change helped, I don't call it an improvement.
- **Know what the framework does for you.** I rebuilt the core of LangChain and LangGraph in [Mingraph](/writing/mingraph/) to see where their abstractions leak. Now I decide case by case whether a framework is worth it.
- **Treat cost as a design input.** A pipeline gets a token budget before it gets users.
