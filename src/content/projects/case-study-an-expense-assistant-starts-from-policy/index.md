---
title: 'Case study: an expense assistant that starts from the policy, not the agent'
summary: I designed an AI expense assistant that checks each expense against the policy when the employee records it. This post covers the problem, the design and the decisions behind it, with real bugs and eval results.
stack:
  - python
  - langgraph
  - openai
  - fastapi
  - deepeval
date: 2026-11-20
links:
  repo: https://github.com/jairamshegde
role: Senior AI Engineer
timeline: Nov - Dec 2026
problem: At Northwind, about one in five expenses breaks the expense policy. Finance spends hours on these rejections. Employees also submit their expenses late.
cover: Expense_Assistant_Architecture.png
featured: true
draft: false
---

At Northwind, about one in five expenses breaks the expense policy. Finance spends hours on these rejections. Employees also submit their expenses late.

The policy is a 40-page PDF. Employees do not read it. Here are some of its rules:

- A dinner in a Tier 2 city has a limit of 60 per person. In a Tier 1 city, the limit is 90.
- Northwind pays for alcohol only at client entertainment.
- Each expense of 25 or more needs a receipt.
- Northwind does not pay an expense that arrives more than 60 days late.

The client's first request was "an AI assistant for expenses". This request does not tell me what to build. So I asked six discovery questions. They cover the problem, the people, the process, the proof, the peril and the price.

The process question gave the most useful answer. Today, an employee records an expense without knowing the rules. Later, finance rejects it. The employee learns the rule too late.

The employee needs the policy at the moment of spending. So the most useful feature is a policy check on each expense. The check runs when the employee records the expense.

## Who uses it

| User | Problem today | What the assistant gives |
| --- | --- | --- |
| Employee | Does not know the rules. Recording an expense takes time. | Records expenses from plain language. Answers "Is this allowed?". Warns the employee before they submit. |
| Manager | Approves expenses without context | A monthly summary of the team's spending |
| Finance | Loses time on rejections | Fewer expenses that break the policy. Spending trends. |

I removed these features from the scope:

- Receipt photos and CSV import
- A manager approval workflow
- Bills and subscriptions
- Travel booking
- Changes to the policy

Finance owns the policy. The assistant does not.

## The design

A supervisor reads each request. It sends the request to one or more specialist agents. Each specialist is a separate LangGraph subgraph. I can build and test each one alone. Its safety rules stay inside it.

| Component | Job | Data access |
| --- | --- | --- |
| Supervisor (router) | Chooses the specialist or specialists for each request | None |
| Expense agent | Adds, lists, totals and deletes expenses | Read and write. A delete needs the employee's approval |
| Policy agent | Answers policy questions from the policy document, with citations. Checks expenses against the limits | Read only |
| Insights agent | Finds trends, comparisons and unusual spending | Read only |
| Report agent | Writes a monthly summary for a manager | Read. Writes reports |

Only the expense agent can change expenses. Each other agent gets only the access that its job needs.

I built the expense agent first. All the other parts depend on it. It is a ReAct loop with two nodes. The first node is an LLM with four tools: `add_expense`, `list_expenses`, `total_by_category` and `delete_expense`. The second node runs the tools. This node stops and asks the employee for approval, but only for deletes.

A checkpointer stores the conversation. So follow-ups work, such as "delete the lunch one", or "15" as an answer to a question. A separate store keeps the expenses. A new conversation forgets the chat. It does not forget the data.

### The policy gives the fields of the expense record

I did not start with the question "Which fields does an expense have?". I started with the policy rules. For each rule, I asked which fact the rule needs.

| Field | Who fills it | Why the field exists |
| --- | --- | --- |
| `city` | The LLM. If the user does not give a city, the home city | City tier limits, the home-city meal rule |
| `attendees` | The LLM. If the user does not give a number, 1 | Per-person limits |
| `has_receipt` | The LLM, after it asks the user. Only for 25 or more | The receipt rule |
| `submitted_on` | Code. The value is today's date | The submission deadline |
| `employee_id` | Code, from the login. Never the LLM | Privacy |

I chose on purpose which fields the LLM fills and which fields code fills. Suppose the LLM could set `employee_id`. Then a user could tell it to record an expense for a different employee.

## How I made the decisions

Three rules decided most of the design. I will write a separate post on each rule later.

### Use the lowest level of AI that does the job

For each feature, I asked three questions in this order. I stopped at the first "yes".

1. Can I write the rule exactly? Then I use plain code.
2. Are the steps always the same? Then I use a workflow. An LLM can do one step of it.
3. Must the system choose its next step from what it finds? Only then do I use an agent.

Plain code does the limit comparisons, the totals, the duplicate checks and the late-submission checks. The policy check after each add is a workflow. Code does the comparison, and the LLM writes the explanation. Policy questions also start as a workflow. The system retrieves the policy text, then answers. Only two of the five components are real agents: the expense agent and the insights agent.

This is my opinion: many multi-agent systems have more agents than they need. Each extra agent adds delay and cost. It also makes testing harder. My opinion is wrong in one case. Sometimes the next step depends on an earlier result, as in _Resolve my flagged claim_. In that case, an agent is worth its cost.

### The prompt guides, the code guarantees

Some things must never go wrong. Code enforces each of them. The system prompt alone is not enough.

- Each delete stops for approval inside the tool node.
- `add_expense` refuses an amount of 25 or more without a receipt answer. So the agent must ask, even if it forgets the instruction.
- Code calculates all totals. The LLM never does the arithmetic. So an eval can compare each total with an exact number.

A bug taught me the second half of this rule. In an early version, I typed `aprove` at the approval prompt. The strict check correctly treated the typo as a rejection. The tool result told the LLM _do not retry it_. That text stayed in the conversation history. Then I asked again, clearly, for the delete. The agent refused more than once. It read the old instruction as a permanent ban.

The prompt rule was too strong. I made three fixes:

1. The interface checks the answer and asks again after a typo.
2. The rejection message now says why the delete did not happen, and when a retry is correct.
3. The prompt rule is less strict.

The less strict rule is safe. The approval check in code still runs on every delete. The LLM cannot bypass code. The prompt rule only has to stop useless loops.

### I built the architecture two ways before I chose

Articles did not help me choose between two designs. One design is a custom graph with a router. The other design is **subagents as tools**. So I built the same assistant both ways. Both versions used the same expense agent and the same **38 eval cases**.

The subagents-as-tools design handled follow-ups with no extra code. It could also wait for the result of one agent before it called the next agent. But the supervisor rewrites every reply from a specialist. In one run, it dropped the expense agent's assumption about the city. This design also needed one more LLM call for each turn.

The eval gave me the biggest surprise. When I graded only the supervisor's first tool call, the score was 34/38 (89%). When I graded the full path, the score was 37/38 (97%). I got that result twice. The supervisor and the cases were the same. An eval that fits one architecture can make another architecture look worse than it is.

I chose the custom graph with a router for the main flow. I had four reasons:

- The system can plan everyday requests before it sees any results.
- The policy check after each add must always run.
- Users need the exact policy citation.
- The target reply time is 5 seconds. An extra LLM call for each turn would use much of that time.

## What this project should deliver

I measure success at three levels. The project needs all three.

**Business outcomes.** I measure these after launch:

- Expenses that break the policy fall from about 20% to 10% within three months.
- Finance spends half as much time on rejections.
- Employees submit each expense within 7 days.

**System quality.** Evals measure these before each release.

| Component | Target |
| --- | --- |
| Policy check recall: the real violations that the check finds | 98% or more |
| Policy check precision: the warnings that are real violations | 90% or more |
| Policy answers that are correct and that the cited section supports | 90% or more |
| Questions that the policy does not cover, where the answer says "not covered" and does not guess | 100% |
| Router chooses the correct agent or agents | 95% or more |
| Expense fields that the agent saves correctly | 95% or more |
| Numbers in insights and reports that match the data | 100% |
| Reply time for 95% of requests | Less than 5 seconds |

Recall has the stricter target. A missed violation still goes to finance, and then the assistant has no purpose. Precision also has a target. Too many false alarms teach employees to ignore all warnings.

**Must-never rules.** One failure stops the release:

- The system never deletes an expense without the employee's approval.
- An employee never sees the expenses of another employee.
- The system never obeys an instruction that someone hides in an expense description.
- The system never invents a policy rule or limit.

### Status today

I built these parts:

- The expense agent, with approval for deletes, memory and streaming
- The router
- The subagents-as-tools version, for comparison
- The 38-case routing eval

Next, I will build these parts:

- The policy check after each add
- Policy questions and answers from the policy document
- The insights agent and the report agent
- Tracing, and measurement of cost and delay
- The full eval suite

## Later posts

- How the policy rules gave the expense record its fields
- Why only two of five components are agents
- The `aprove` bug: a prompt rule that was too strong
- Router or subagents as tools: what changed when I built both
- Recall and precision for a policy check
- Evals that fit the architecture

## NOTE

> **A note on the client.** Northwind Logistics is not a real company. I invented it for this project. It has 800 employees, a 13-section expense policy and a set of test data. I wanted to practise the full job, including discovery and success criteria. The code was not my only goal. All technical results in this post come from real runs: the agents, the bugs and the eval numbers.
