---
title: Bias-Variance Tradeoff
type: note
tags: [machine-learning, model-evaluation, statistics, data-science]
status: review
sources:
  - https://en.wikipedia.org/wiki/Bias%E2%80%93variance_tradeoff
---

## Summary

The bias-variance tradeoff is a central concept in supervised machine learning that describes the tension between two sources of error: erroneous, overly simplistic assumptions (bias) and excessive sensitivity to small fluctuations in the training data (variance). The ultimate goal of any predictive model is to generalize well to unseen data, which requires finding the mathematical "sweet spot" that minimizes the sum of both errors.

## Key points

* **Bias (Underfitting):** The error introduced by approximating a complex real-world problem with a model that is too simple (e.g., using a linear model for highly non-linear data). Models with high bias ignore training data patterns and generally perform poorly on both training and test sets.
* **Variance (Overfitting):** The error introduced when a model is overly complex and learns the random noise in the training data rather than the underlying signal. High variance models memorize the training set (low training error) but fail to generalize to new data (high test error).
* **The Tradeoff Dynamic:** Model complexity acts as a slider. As complexity increases (e.g., deeper decision trees, more polynomial degrees), bias decreases but variance increases. Conversely, reducing complexity increases bias but decreases variance.
* **Mathematical Decomposition:** The expected test error of a model decomposes into three distinct components:
$E[(y - \hat{f}(x))^2] = \text{Bias}[\hat{f}(x)]^2 + \text{Var}[\hat{f}(x)] + \sigma^2$
The $\sigma^2$ represents **irreducible error** (inherent noise in the data itself), which no model can eliminate.
* **Finding the Sweet Spot:** The optimal model architecture is found at the lowest point of the total error curve, where the combination of bias and variance is minimized. This is typically identified using validation sets or $k$-fold cross-validation.
* **Remediation Strategies:**
* *To fix High Bias:* Increase model complexity, engineer more relevant features, or decrease regularization parameters.
* *To fix High Variance:* Gather more training data, simplify the algorithm, prune trees, or increase regularization (e.g., L1/L2 penalties, dropout).



## Links

* Fundamental concept in [[Supervised Learning]]
* Directly responsible for the phenomena of [[Overfitting and Underfitting]]
* Managed using techniques like [[Regularization]] and [[Cross-Validation]]