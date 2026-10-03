---
title: "Dataclasses with slots=True"
date: 2026-09-12
tags: [python]
draft: false
---

`slots=True` gives a dataclass `__slots__`, which cuts memory per instance and blocks typo'd attributes.

## Example

```python
from dataclasses import dataclass

@dataclass(slots=True)
class Point:
    x: float
    y: float
```
