---
title: Dropout (Neural Networks)
type: note
tags: [deep-learning, machine-learning, regularization, neural-networks]
status: review
sources: []
---
## Summary

**Dropout** is a powerful and computationally efficient **regularization technique** used almost exclusively in Deep Learning to prevent neural networks from overfitting. By randomly "dropping out" (setting to zero) a percentage of neurons during each step of the training phase, the network is forced to learn more robust, redundant features rather than memorizing the training data.

## Key points

* **How it Works:** During every iteration of training, each neuron has a probability $p$ (often between 0.2 and 0.5) of being temporarily deactivated, along with all its incoming and outgoing connections. In the next iteration, a completely different random set of neurons is deactivated.
* **Prevents Co-adaptation:** Without dropout, certain neurons can become "lazy" and overly reliant on the outputs of a few specific neighboring neurons to make predictions. Dropout breaks these dependencies, forcing every neuron to independently learn useful features.
* **The Ensemble Effect:** Because a slightly different network architecture is trained in every single iteration, Dropout mathematically approximates training a massive ensemble of different neural networks and averaging their predictions, which inherently reduces model variance.
* **Training vs. Testing (Inference):** Dropout is **only active during the training phase**. When the model is evaluated on test data or deployed to production, all neurons are kept active to maximize predictive power. (The framework automatically scales the weights down during testing to compensate for the extra active neurons).

## Implementation Example

In modern Deep Learning frameworks like TensorFlow/Keras, Dropout is implemented as its own distinct layer that affects the outputs of the layer immediately preceding it.

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout

model = Sequential()

# Add a standard fully connected hidden layer with 64 neurons
model.add(Dense(64, activation='relu'))

# Add Dropout to randomly deactivate 50% of the neurons in the previous layer during training
model.add(Dropout(0.5))

# Output layer
model.add(Dense(1, activation='sigmoid'))

```

## Links

* A critical technique for managing the [[Bias-Variance Tradeoff]] in deep learning
* A specific form of [[Regularization]]
* Shares conceptual similarities with the feature-randomness of a [[Random Forest]]
* Used to optimize complex [[Neural Networks]]