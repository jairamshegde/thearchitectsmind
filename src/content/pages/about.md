---
title: "Jairam Hegde"
intro: "Jairam Hegde is an engineer who turns hard problems into simple systems. Lately those problems are AI agents, and whether they really work."
lead: "I’m happiest when a problem doesn’t have an obvious answer yet."
leadMore: "Lately those problems are AI agents, and whether they really work."
welcomeImage: pico-welcome.png
welcomeNote: "I’m Pico. I ask what the real problem is. Every time."
summary:
  - { label: "approach", value: "Problem first, tools second" }
  - { label: "working on now", value: "AI agents, evals and observability" }
  - { label: "usual stack", value: "Python, FastAPI, LangGraph, Qdrant" }
  - { label: "reviewed by", value: "Pico" }
steps:
  - { title: "Find the real problem.", text: "The problem people describe is rarely the one that needs fixing. I ask until the two match." }
  - { title: "Break it into small pieces.", text: "Each piece gets one job, so I can reason about it and replace it on its own." }
  - { title: "Build the simplest thing that works.", text: "Plain code first. I add a framework, or a model, only when a piece needs it." }
  - { title: "Prove it works.", text: "A test, an eval, a number. If I can’t show the fix worked, it isn’t done." }
signoff: "A fix nobody measured. \"It looks better\" is where I start checking, not where I stop."
quirks:
  - "Rebuilds things from scratch to see how they work. See [Mingraph](/writing/mingraph/)."
  - "Draws the boxes before writing any code."
  - "Asks \"what problem are we solving?\" in every design review. Pico started it."
now:
  - { label: "building", value: "Mingraph, LangChain and LangGraph rebuilt from scratch" }
  - { label: "writing", value: "The Mingraph series, one design pattern per part" }
  - { label: "reading", value: "An Illustrated Guide to AI Agents" }
  - { label: "exploring", value: "Evals for multi-step agents" }
contact: "Open to conversations about agents, evals, or any problem that needs taking apart."
---

AI agents, and the checks around them. I build agents that call tools, and retrieval systems that answer from documents. Then I build the evals that score each answer, and the traces that show which step went wrong.

Usually on Python and FastAPI, with LangGraph, Qdrant, Redis and Celery underneath, and Ragas, DeepEval and Arize Phoenix to check the results.
