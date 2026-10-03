---
title: "Order pipeline redesign"
summary: "Split a synchronous checkout into an event-driven pipeline that survives payment-provider outages."
stack: [Python, FastAPI, PostgreSQL, Kafka]
date: 2026-06-01
links:
  repo: "https://github.com/jairamshegde/order-pipeline"
role: "Lead architect"
timeline: "Jan – May 2026"
problem: "Checkout called payments, stock and email **synchronously**. Any slow dependency failed the whole order."
constraints: "No downtime migration, a team of four, and the existing PostgreSQL schema had to stay."
outcome: "Checkout p99 dropped from 2.4s to 380ms; zero lost orders during two provider outages."
lessons: "Model the outbox table first. Every later decision got easier once events were durable."
cover: cover.svg
featured: true
draft: false
---

## Approach

We moved side effects behind an outbox and let consumers retry independently.

## Architecture

```mermaid
graph LR
  API[Checkout API] --> DB[(Orders + Outbox)]
  DB --> Relay[Outbox relay]
  Relay --> Bus{{Kafka}}
  Bus --> Pay[Payments worker]
  Bus --> Stock[Stock worker]
  Bus --> Mail[Email worker]
```

## Rollout

Dual-write for two weeks, compare, then cut over per region.
