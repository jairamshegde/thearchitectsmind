---
title: "Phase 0: OOP Wasn't the Problem. My Mental Model Was."
subheading: 'LangGraph from Scratch, Phase 0 : Finally Idea of OOPs mindset clicked!'
description: Intuitive sense of getting the idea behind oops programming and how to think about it.
date: 2026-10-11
updated: 2026-10-11
tags:
  - python
  - oops
cover: late_night_coding_session.png
featured: false
draft: false
---

I always wanted to learn OOP properly. And I tried. A lot. I went through tutorials, blogs, courses, and hands-on exercises. I built calculators, small utilities, and whatever project the tutorial happened to suggest. Eventually, I could explain all the usual things.

1.  A class is this.
    
2.  Inheritance is that.
    
3.  Encapsulation means this.
    
4.  Polymorphism means that.
    

But there was still a problem.

> I understood OOP, but I didn't feel like I understood OOP.

That distinction bothered me.

Because every time I started a new tutorial, the concepts made sense. But when I stepped away from the tutorial and had to design something myself, I didn't naturally think, *This is where I should use composition,* or *This responsibility belongs to another object.*

I was learning the vocabulary, but somehow missing the intuition. For a while, I assumed the solution was simple: I just needed more practice. So I kept practicing, until I started wondering what exactly I was supposed to practice. Writing more classes, more inheritance hierarchies, more toy applications?

That question became interesting when I started building **Mingraph**, my attempt at creating a minimal version of LangChain and LangGraph.

This time, I wasn't following someone else's implementation. I had to make the decisions myself. And that's where things started to feel different. I would reach a point where I had to decide where a responsibility should live.

Then another question would appear: *If I put it here, what becomes coupled to it?*

Then another: *What happens when I need to change this later?*

Then: *Do I actually need an abstraction here, or am I just creating one because “good OOP” says I should?*

I also built a learning harness around the project so I could make these decisions more deliberately. I'll write about that separately.

At some point, I realized these questions felt familiar. That wasn't because I had suddenly become good at OOP. I've been asking these questions in engineering work for years. When designing a system, I already think about responsibilities, boundaries, and coupling. I think about what is likely to change and what should remain stable, how components should communicate, and which decisions should be isolated.

So why did OOP feel so unfamiliar?

That was the moment it clicked for me.

> I was studying OOP as theory, but I already used the same thinking every day at work.

I wasn't missing the ability to think in objects. I was missing the connection between the engineering problems I was already solving and the concepts I had been memorizing.

Classes, interfaces, inheritance, composition, polymorphism: suddenly they looked different. They stopped being things to memorize and became tools for expressing decisions. That changed the question I ask when I think about OOP.

Instead of asking:

> “Which OOP concept should I use here?”

I now find myself asking:

> “What is the design problem I'm trying to solve?”

Where should this responsibility live?

What should know about what?

What needs to change independently?

Where do I want a boundary?

What kind of coupling am I creating?

And only then: **Which language construct helps me express that design?**

That, for me, was the OOP aha moment. Maybe I didn't need another OOP tutorial.

> Maybe I needed to stop learning OOP as a collection of constructs and start seeing it as a way of reasoning about software design.
> 
> I needed to start with the design problem, and then use OOP as a tool to solve it.
