---
title: Transformers
type: note
tags: [ai-ml, architecture, llm]
status: learning
sources:
  - https://arxiv.org/abs/1706.03762
  - https://www.youtube.com/watch?v=zxQyTK8quyY
---
## Summary
The transformer replaced recurrence with **self-attention**, letting every
token attend to every other token in parallel.

## Key points
- Q/K/V attention; multi-head attention captures different relationships
- Positional encodings inject order
- Decoder-only stacks (GPT-style) power most current LLMs

## Links
- Learns via [[Gradient Descent]]
- Security angle: [[Prompt Injection]]
