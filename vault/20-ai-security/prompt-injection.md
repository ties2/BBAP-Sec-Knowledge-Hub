---
title: Prompt Injection
type: note
tags: [ai-security, llm, owasp-llm01]
status: learning
sources:
  - https://owasp.org/www-project-top-10-for-large-language-model-applications/
  - https://www.youtube.com/watch?v=Sv5OLj2nVAQ
---
## Summary
Untrusted input overrides the developer's intended instructions to an LLM.
OWASP ranks it **LLM01** — the top LLM risk.

## Types
- Direct (user types the malicious instruction)
- Indirect (payload hidden in fetched web pages, PDFs, emails the model reads)

## Defenses (partial)
- Input/output filtering, privilege separation, signed/quoted context
- Never give an LLM more authority than the least-trusted input it sees

## Links
- Targets [[Transformers]]-based models
- Practice: [[Prompt Injection Lab]]
