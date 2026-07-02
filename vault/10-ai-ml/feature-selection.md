---
title: Feature Selection
type: note
tags: [machine-learning, data-preprocessing, dimensionality-reduction, feature-engineering]
status: review
sources: []
---

## Summary
Feature selection is the crucial preprocessing step of identifying and selecting a subset of the most relevant features (variables or predictors) from a dataset for use in model construction. By eliminating redundant, irrelevant, or noisy data, this process simplifies models, making them faster to train, easier to interpret, and less prone to memorizing random noise (overfitting).

## Key points

* **Core Objectives:**
  * **Prevent Overfitting:** Removing noisy or irrelevant features lowers model variance, improving generalization to new data.
  * **Reduce Computation:** Training on fewer columns significantly decreases training time and memory consumption.
  * **Improve Interpretability:** A model with 5 key predictors is easier to explain than a "black box" relying on thousands of opaque variables.

* **Three Main Categories:**

  | Criterion | Filter Methods | Wrapper Methods | Embedded Methods |
  |---|---|---|---|
  | When applied | Before model training | Iterative loop around a model | During model training |
  | Speed | Very fast | Slow / expensive | Moderate (more efficient than Wrapper) |
  | Captures feature interactions | Poor (evaluates each column independently) | Strong | Strong |
  | Overfitting risk | Low | High | Low (built-in penalty) |
  | Examples | `SelectKBest` (ANOVA, Chi-Square, Mutual Info) | `RFE`, `RFECV` | Lasso (L1), tree-based importances |

### 1. Filter Methods
Evaluate each feature independently of any ML algorithm, using a statistical scoring function, then keep the top *k*.

* **`f_classif` (ANOVA F-test):** For **continuous numeric features** with a **categorical target**. Computes an F-value = *between-group variance* / *within-group variance*. A high F-value means the feature's class means are far apart while each class is internally tight — i.e., strong separating power. A low F-value means heavy class overlap.
* **`chi2` (Chi-Square test):** For **categorical features** with a **categorical target**. Compares observed vs. expected frequencies to test independence from the target class. Requires non-negative inputs, so text categories must first be numerically encoded (e.g., with `OrdinalEncoder`).
* **`mutual_info_classif`:** Also for categorical/general features; based on information theory, measuring how much knowing a feature's value reduces uncertainty about the target. Can capture non-linear relationships that ANOVA/Chi-Square miss.
* **`f_regression`:** Same idea as `f_classif` but for continuous numeric targets (regression tasks).

Quick reference table:

| Feature type | Target type | Function |
|---|---|---|
| Numeric (continuous) | Categorical (classification) | `f_classif` |
| Categorical | Categorical (classification) | `chi2` or `mutual_info_classif` |
| Numeric (continuous) | Numeric (regression) | `f_regression` |

```python
from sklearn.feature_selection import SelectKBest, f_classif

# Select the top 2 features based on the ANOVA F-value
selector = SelectKBest(score_func=f_classif, k=2)
X_new = selector.fit_transform(X, y)
```

Categorical example (requires encoding text to numbers first):

```python
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.preprocessing import OrdinalEncoder

encoder = OrdinalEncoder()
X_encoded = encoder.fit_transform(X)  # convert text categories to numeric codes

selector = SelectKBest(score_func=chi2, k=2)
X_new = selector.fit_transform(X_encoded, y)
```

### 2. Wrapper Methods
Delegate the evaluation of feature importance to an actual ML model, searching over feature subsets rather than relying on a fixed statistical formula. More computationally expensive but can capture interactions between features that filter methods miss (e.g., two individually weak features that are jointly predictive).

* **`RFE` (Recursive Feature Elimination):**
  1. Train the model on all features.
  2. Rank features by the model's assigned importance/weight.
  3. Remove the weakest feature(s).
  4. Repeat until only the desired number of features (`n_features_to_select`) remains.

```python
from sklearn.feature_selection import RFE
from sklearn.ensemble import RandomForestClassifier

estimator = RandomForestClassifier()
selector = RFE(estimator, n_features_to_select=5, step=1)
X_new = selector.fit_transform(X, y)
```

* **`RFECV` (RFE with Cross-Validation):** Solves RFE's main drawback — having to guess the optimal number of features — by testing model performance (via cross-validation) at every elimination step and automatically selecting the feature count that yields the best score.

```python
from sklearn.feature_selection import RFECV
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold

estimator = RandomForestClassifier()
cv = StratifiedKFold(5)

selector = RFECV(estimator, cv=cv, scoring='accuracy', step=1)
X_new = selector.fit_transform(X, y)

print(f"Optimal number of features: {selector.n_features_}")
```

### 3. Embedded Methods
Feature selection happens *inside* the model-training process itself, rather than as a separate preprocessing step — generally faster and less overfitting-prone than Wrapper methods while still capturing feature interactions.

* **Lasso Regression (L1 Regularization):** Adds a penalty term proportional to the absolute value of feature coefficients. This pressure forces the weights of weak/redundant features to shrink exactly to zero, effectively removing them from the model.
* **Tree-based models** (Random Forest, Decision Tree): Inherently embedded — they naturally ignore low-discriminative features while building splits.

```python
from sklearn.linear_model import Lasso
import numpy as np

lasso = Lasso(alpha=0.1)  # alpha controls penalty strength
lasso.fit(X, y)

# Features with non-zero coefficients survived selection
selected_features = np.where(lasso.coef_ != 0)[0]
print(f"Number of selected features: {len(selected_features)}")
```

## Links
* A key technique in the broader field of [[Feature Engineering]]
* Related to, but distinct from, [[Dimensionality Reduction]] (which creates *new* combinations of features, like PCA, rather than selecting from existing ones)
* Directly helps manage the [[Bias-Variance Tradeoff]] by reducing variance (overfitting)
* Compare evaluation strategies: [[Filter Methods]] vs [[Wrapper Methods]] vs [[Embedded Methods]]