---
title: Random Forest
type: note
tags: [machine-learning, ensemble-learning, decision-trees, supervised-learning]
status: review
sources: []
---

## Summary

Random Forest is a highly versatile **ensemble learning** method that operates by constructing a multitude of decision trees during the training phase. Instead of relying on a single, potentially unstable tree, Random Forest aggregates the predictions of all its individual trees to produce a final, highly accurate, and robust outcome. It acts on the principle of the "wisdom of the crowd."

## Key points

* **Bagging (Bootstrap Aggregating):** Random Forest is built on the concept of bagging. Each individual tree in the forest is trained on a *random sample* of the training data drawn with replacement (bootstrapping).
* **Feature Randomness:** To ensure the trees do not all learn the exact same patterns (which would defeat the purpose of an ensemble), Random Forest introduces a second layer of randomness. When splitting a node, the algorithm only considers a random subset of the available features, forcing the trees to be diverse and uncorrelated.
* **The Aggregation Process:** Once all trees are built, they make independent predictions on new data.
* For **Classification:** The forest uses "majority voting" (the class chosen by the majority of the trees wins).
* For **Regression:** The forest calculates the mathematical "average" of all individual tree predictions.


* **Why it is so effective:** - **Reduces Overfitting:** A single decision tree is highly prone to overfitting (high variance). Averaging multiple uncorrelated trees effectively cancels out this noise, drastically lowering variance without sacrificing the model's underlying logic (bias).
* **Feature Importance:** It natively calculates how much each feature contributes to the model's decisions, making it an excellent tool for feature selection.
* **Low Maintenance:** It generally requires very little hyperparameter tuning to get a "good enough" result and does not require feature scaling (standardization/normalization).



## Implementation Example

Using `scikit-learn`, building a Random Forest is incredibly straightforward. The `n_estimators` hyperparameter dictates the number of trees in your forest (default is usually 100).

```python
from sklearn.ensemble import RandomForestClassifier

# Initialize the model with 100 decision trees
rf = RandomForestClassifier(n_estimators=100, random_state=42)

# Train the "forest" on the training data
rf.fit(X_train, y_train)

# Evaluate the model's accuracy on unseen test data
accuracy = rf.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.4f}")

```

## Links

* An evolution and stabilization of standard [[Decision Trees]]
* A textbook implementation of the [[Bagging]] technique within [[Ensemble Learning]]
* Directly addresses the variance side of the [[Bias-Variance Tradeoff]]
* Often benchmarked against boosting algorithms like [[XGBoost]]