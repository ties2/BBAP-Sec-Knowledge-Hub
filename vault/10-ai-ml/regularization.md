---
title: Regularization
type: note
tags: [ai-ml, regularization, model-evaluation]
status: review
sources: []
---
## Summary

A technique used to reduce model complexity and prevent overfitting by adding a penalty on model parameters.

## Key points

* L1 (Lasso) adds an absolute value penalty, which can help with feature selection by driving some weights to zero
* L2 (Ridge) adds a squared magnitude penalty to shrink parameter weights evenly
* Python implementation example using Ridge:

```python
from sklearn.linear_model import Ridge
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)
print(ridge.score(X_test, y_test))

```

## Links

* Used directly to prevent [[Overfitting]]
* Core mechanism behind [[Lasso Regression]] and [[Ridge Regression]]