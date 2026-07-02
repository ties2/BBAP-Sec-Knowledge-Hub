---
title: Hub Model Monitoring
type: note
tags: [mlops, telemetry, ai-security]
status: learning
sources:
  - https://whylabs.ai
  - https://evidentlyai.com
---

## Implementation Details
This note tracks the implementation of local telemetry inside the BBAP-Sec Knowledge Hub.

### Metrics to Capture
1. **Security**: Detection rate of adversarial inputs and prompt injections.
2. **Quality**: Retrieval token overlap (BM25 vs semantic chunk relevance).
3. **Performance**: Ollama generation latency vs Claude API response times.

### Alert Thresholds
* If query latency > 5000ms: Log a system performance bottleneck warning.
* If input similarity to `vault/20-ai-security/` jailbreaks > 0.85: Trigger a security alert block in the dashboard UI.
