---
title: 'Web Search with the DeepSeek API: What Finally Worked and What Blew Up My Token Bill'
date: 2026-10-03
tags:
  - deepseek, websearch, python, llm, tool call,
draft: false
---

I'm working on a project that needs to search the web and then scrape the pages it finds. That second part is what makes it different from the web search built into the popular LLM chat apps. I wanted to reproduce that flow in my own code: run a search, pick the most relevant websites from the results, then pull content from those pages, keeping the scraping to what each site allows and what's legal.

If you're building something similar in Python, whether it's an agent or a research tool, you need two things from the search step: results that match the query, and an API you can call from code. Getting both at once was the hard part. Free search APIs looked like they could do that, so that's where I started

## Free search APIs returned too much noise

My first pick was the DuckDuckGo API. After that came SearXNG (an open-source metasearch engine), then Tavily (a search API aimed at AI applications).

None of them did the job. The searches cast a very wide net, and very little of what came back was relevant to my queries. My scraper works on whatever URLs the search step hands it, so irrelevant results meant the rest of the pipeline was scraping the wrong pages. If the free tools couldn't surface the right sites, I needed search that understood the query better, \*\*even if it cost money.\*\*

## From frontier chat apps to DeepSeek's half-working search

That led me to the frontier models and their web interfaces. Their answers were somewhat more accurate, but still not accurate enough for what I needed. On top of that, the search lived inside a chat window. I couldn't call it directly from my code, and using those services this way was expensive.

Then I came across a [blog post](https://chendahuang.com/en/blog/deepseek-api-web-search/) saying DeepSeek could search the web. The post was a little old, and when I went through DeepSeek's documentation I couldn't find the capability described. I wanted to use it directly from Python, so I read what documentation I could find and put together a first attempt.

The first request worked. I got a search response back. When I sent a second request, I got nothing useful, only placeholders, and after that the calls started failing.

```text
=== THINKING START ===

The user is asking about "agent harness" and how it relates to "context engineering" as of September 2026. This is a forward-looking date—my knowledge cutoff is earlier, so I need to search the web. Let me do multiple searches.

Let me search for "agent harness" AI, "context engineering", their relationship.

=== THINKING END ===

I'll search for information on this topic.

<｜｜DSML｜｜ calls>

<｜｜DSML｜｜ invoke name="web_search">

<｜｜DSML｜｜ parameter name="query" string="true">agent harness context engineering AI</｜｜DSML｜｜ parameter>

</｜｜DSML｜｜ invoke>

<｜｜DSML｜｜ invoke name="web_search">

<｜｜DSML｜｜ parameter name="query" string="true">"agent harness" AI agents definition 2026</｜｜DSML｜｜ parameter>

</｜｜DSML｜｜ invoke>

</｜｜DSML｜｜ calls>

=== FINAL ANSWER ===
```

So I went back to [reading documentation](https://api-docs.deepseek.com/guides/responses_api/#tools), did more research, and used LLMs to help me work out a correct version of the code. That round of digging turned up the detail that mattered most: DeepSeek V4 Pro handles the web search tool much better than DeepSeek V4 Flash.

## Switching to V4 Pro and taming reasoning effort

Knowing that, I switched my code to V4 Pro, and search worked. The next problem showed up when I looked at my token usage: it had gone through the roof.

The cause was the reasoning effort setting. Reasoning effort controls how much the model thinks before it answers. I believe I was running on the default, and at that level the model burned through a large number of tokens working over the information it gathered from the websites it searched.

DeepSeek offers a few levels for this setting. In my setup the options were none, low, high, and max. I started with low.

At low, the whole flow worked end to end. The model searched the web, gave a clear explanation of what it found, and returned the top three to five results for my query.

Here's the snippet:

```python
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not API_KEY:
    raise SystemExit("DEEPSEEK_API_KEY is not set in .env")

client = OpenAI(api_key=API_KEY, base_url="https://api.deepseek.com")

MODEL = "deepseek-v4-pro" # deepseek-flash
REASONING_EFFORT = "low" # none, high, max

INSTRUCTIONS = (
    "You are a web search specialist assistant. Use the web_search tool to find the most "
    "accurate, relevant and novel sources for the user's query. Search more than once with "
    "different phrasings if the first results are thin. Answer only from what the search "
    "results actually say, and cite the URLs you used. If the results do not support an "
    "answer, say plainly that you could not find reliable information."
)

stream = client.responses.create(
    model=MODEL,
    instructions=INSTRUCTIONS,
    tools=[{"type": "web_search"}],
    input="what is the agent harness how it related context engineering as of septmber 2026?",
    reasoning={"effort": REASONING_EFFORT},
    stream=True,
)

reasoning_content = ""
content = ""
thinking_started = False

for event in stream:
    if event.type == "response.reasoning_text.delta":
        if not thinking_started:
            print("=== THINKING START ===")
            thinking_started = True
        reasoning_content += event.delta
        print(event.delta, end="", flush=True)
    elif event.type == "response.output_text.delta":
        if thinking_started:
            print("\n=== THINKING END ===")
            thinking_started = False
        content += event.delta
        print(event.delta, end="", flush=True)

if thinking_started:
    print("\n=== THINKING END ===")

print("\n=== FINAL ANSWER ===")
# print(content)
```

### ### Token Consumption Metric

| Reasoning | Token Count | Result Accuracy |

| --- | --- | --- |

| default | \~100k | High |

| low | \~45k | moderate |

### Without Streaming

Remove everything from stream add this snippet

```python
response = client.responses.create(
    model=MODEL,  # Currently the only model supporting web_search
    instructions=INSTRUCTIONS,
    tools=[{"type": "web_search"}],  # Declare the server-side web_search tool
    input="how to make evals for agent harness as of spetember 2026",
    reasoning={"effort": REASONING_EFFORT},
    stream=True
)

reasoning_content = ""
for item in response.output:
    if item.type == "reasoning":
        # The reasoning text is typically in item.summary or item.content
        if hasattr(item, "summary") and item.summary:
            reasoning_content += item.summary[0].text
        elif hasattr(item, "content") and item.content:
            reasoning_content += item.content

print("=== THINKING START ===")
print(reasoning_content if reasoning_content else "(No reasoning content returned)")
print("=== THINKING END ===")

print("\n=== FINAL ANSWER ===")
print(response.output_text)
```

> One more lesson: treat old blog posts as leads, not documentation. The post that pointed me to DeepSeek was right that the capability existed, but getting it to work took the current documentation and a lot of testing.

## What each dead end taught me

Looking back, each step ruled something out. Free search tools gave me noise. Frontier chat interfaces were more accurate but not reachable from my code, and not cheap. DeepSeek's search worked once and then broke. What fixed it was a model choice and one parameter: V4 Pro for the search, and reasoning effort set to low to keep token use sane. If you need web search inside your own pipeline, that's the combination I'd start with.

Happy coding :) and see you in the next post.. 👋
