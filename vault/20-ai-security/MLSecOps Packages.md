---
title: AI/ML Security & MLSecOps Packages
type: note
tags: [ai-ml, security, pypi, mlsecops, adversarial-ml]
status: learning
sources: [pypi.org]
---

## Summary
The Python Package Index (PyPI) hosts a growing ecosystem of Machine Learning Security (MLSecOps) libraries designed to defend, attack, and audit AI models. These tools address vulnerabilities ranging from adversarial attacks on computer vision models to prompt injection in Large Language Models (LLMs) and supply chain risks in model weight serialization.

## Key Points
* **Adversarial Robustness:** Libraries like `adversarial-robustness-toolbox` (ART), `foolbox`, and `cleverhans` are used by red teams to simulate evasion, poisoning, and extraction attacks across standard ML frameworks.
* **LLM Security:** Tools such as `garak`, `pyrit`, and `giskard` automate vulnerability scanning for modern generative AI, focusing on hallucinations, data leakage, and prompt injections.
* **Infrastructure & Serialization:** Malicious code can be hidden in standard `.pkl` (pickle) files. Libraries like `modelscan` audit these files, while `safetensors` provides a secure alternative format for storing neural network weights.
* **Privacy Auditing:** Libraries like `privacy-meter` and `tensorflow-privacy` ensure models do not leak sensitive training data (e.g., membership inference attacks) and support differential privacy.

## Links
* Often used alongside static analysis tools like `pip-audit` or `safety` to prevent **AI Supply Chain Attacks**.
* Replaces legacy saving mechanisms like standard Python `pickle` modules.