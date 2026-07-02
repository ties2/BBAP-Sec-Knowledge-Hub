---
title: Neural Networks
type: note
tags: [machine-learning, deep-learning, artificial-intelligence, neural-networks]
status: review
sources: []
---
## Summary

**Neural Networks** (specifically Artificial Neural Networks, or ANNs) are a class of machine learning algorithms biologically inspired by the structure and function of the human brain. By utilizing interconnected layers of artificial "neurons" (nodes), these models excel at recognizing highly complex, non-linear patterns in data. They serve as the foundational architecture for the entire subfield of Deep Learning.

## Key points

* **Architecture:** A standard neural network is divided into three main parts:
* **Input Layer:** Receives the raw data (features).
* **Hidden Layer(s):** The intermediate layers where the actual processing and pattern recognition happen. (A network with multiple hidden layers is called a "Deep" Neural Network).
* **Output Layer:** Produces the final prediction or classification.


* **How they learn (Weights & Biases):** As data passes through the network, the connections between neurons multiply the inputs by specific "weights" and add "biases." During training, the network iteratively adjusts these weights based on its errors (using a process called *Backpropagation* and *Gradient Descent*) until it learns the optimal mapping from inputs to outputs.
* **Activation Functions:** Each neuron uses a mathematical function (like ReLU or Sigmoid) to determine whether it should "fire" (pass its signal to the next layer). This is what allows neural networks to solve complex, non-linear problems.
* **Versatility:** They are incredibly adaptable and can be used for supervised learning (predicting housing prices, classifying images), unsupervised learning (clustering, dimensionality reduction via autoencoders), and reinforcement learning.

## Implementation Example

While massive neural networks are typically built using frameworks like TensorFlow or PyTorch, you can easily implement a basic neural network (a Multi-Layer Perceptron) using `scikit-learn`:

```python
from sklearn.neural_network import MLPClassifier

# Initialize a Neural Network with 2 hidden layers (one with 10 nodes, one with 5)
nn = MLPClassifier(hidden_layer_sizes=(10, 5), max_iter=1000, random_state=42)

# Train the network on the data
nn.fit(X_train, y_train)

# Evaluate the model's accuracy
accuracy = nn.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.4f}")

```

## Links

* The core engine behind [[Deep Learning]]
* Relies heavily on mathematical optimization techniques like [[Gradient Descent]]
* Uses [[Activation Functions]] to model non-linear relationships