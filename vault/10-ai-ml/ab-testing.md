---
title: A/B Testing
type: note
tags: [ai-ml, evaluation, mlops, experimentation]
status: learning
sources: []
---

## Summary
A/B testing (or online controlled experimentation) is a statistical methodology used to compare two versions of a variable (typically a control group $A$ and a treatment group $B$) to determine which one performs better according to a predefined metric. In AI/ML, it is the gold standard for validating whether a new model variant drives genuine business or operational value over the existing baseline production model.



## Key Points
* **Hypothesis Testing Framework:** * **Null Hypothesis ($H_0$):** The new model ($B$) has no significant effect compared to the current model ($A$).
  * **Alternative Hypothesis ($H_1$):** The new model ($B$) produces a statistically significant change in the primary metric.
* **Core Statistical Parameters:**
  * **Statistical Power ($1-\beta$):** The probability of correctly rejecting the null hypothesis when a true effect exists (typically targeted at 80%).
  * **Significance Level ($\alpha$):** The probability of committing a Type I error (false positive, typically set to 5%).
  * **Minimum Detectable Effect (MDE):** The smallest lift or change in the metric that the experiment is powered to detect.
* **Common ML Pitfalls:**
  * **Selection Bias / Leakage:** If users or data points are not purely randomized, confounding variables can invalidate the results.
  * **Novelty Effect:** Users interacting with a new model feature (e.g., a new recommendation engine layout) might show high engagement initially purely because it is new, which wears off over time.
  * **Sample Ratio Mismatch (SRM):** If the actual ratio of users in group A vs. group B deviates significantly from the designed allocation (e.g., 50/50), it indicates a bug in the randomization mechanism (Kohavi et al., 2020).

## Links
* Often utilized as the final evaluation gate immediately after [[Model Serving]].
* Changes in user behavior during an experiment can sometimes simulate or trigger false alarms in [[Data Drift Detection]].

## References
Kohavi, R., Longbotham, C., Sommerfield, D., & Henne, R. M. (2009). Controlled experiments on the web: Survey and practical guide. *Data Mining and Knowledge Discovery*, 18(1), 140-181. https://doi.org/10.1007/s10618-008-0114-1
Cited by: 1250+

Kohavi, R., Tang, D., & Xu, Y. (2020). *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*. Cambridge University Press. https://doi.org/10.1017/9781108653985