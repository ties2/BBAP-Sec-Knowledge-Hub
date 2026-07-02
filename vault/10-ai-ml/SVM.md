---
title: Support Vector Machine (SVM)
type: note
tags: [machine-learning, supervised-learning, classification, algorithms]
status: review
sources: []
---

## Summary

A **Support Vector Machine (SVM)** is a powerful and versatile supervised machine learning algorithm used primarily for classification (though it can also handle regression). At its core, SVM operates on a spatial premise: it plots data items as points in an $n$-dimensional space and attempts to draw a straight line (or flat plane) that best separates the different classes of data. Its ultimate goal is to find the **optimal hyperplane** that creates the widest possible gap (margin) between the classes.

## Key points

* **The Hyperplane:** This is the decision boundary that separates the classes. In a 2D space (2 features), it is just a line. In a 3D space, it becomes a flat 2D plane. In higher dimensions, it is referred to mathematically as a hyperplane.
* **Support Vectors:** These are the critical data points that lie closest to the decision boundary. They are the "pillars" that support the margin. If you were to remove all other data points and just keep the support vectors, the position of the hyperplane would not change.
* **Maximizing the Margin:** SVM doesn't just look for *any* line that separates the data; it looks for the line that has the maximum distance (margin) from the support vectors of both classes. A wider margin means the model is more robust and will generalize better to new, unseen data.
* **The Kernel Trick:** Real-world data is rarely cleanly separable by a straight line. SVM uses "kernels" (mathematical functions like RBF or Polynomial) to temporarily project the data into a higher-dimensional space where a linear separation *is* possible, without actually computing the coordinates in that higher space (which saves immense computational power).

## Implementation Example

In `scikit-learn`, SVM for classification is implemented using the `SVC` (Support Vector Classification) class. The `kernel` parameter dictates the shape of the decision boundary.

```python
from sklearn.svm import SVC

# Initialize the model with a linear decision boundary
svm = SVC(kernel='linear')

# Train the model on the data
svm.fit(X_train, y_train)

# Evaluate the model
accuracy = svm.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.4f}")

```

## Links

* Belongs to the broader category of [[Supervised Learning]]
* Deeply reliant on the [[Kernel Trick]] for non-linear datasets
* Has a counterpart for continuous data called **SVR** ([[Support Vector Regression]])