---
title: "Reading a flame graph in five minutes"
date: 2026-07-18
tags: [performance, tooling]
description: "Width is time, height is depth, colour is noise."
draft: false
---

## Width is time

The wider a frame, the more samples it appeared in.

## Height is depth

Each layer is a function called by the one below it.

## Look for plateaus

Wide, flat tops are where the CPU actually spends time.
