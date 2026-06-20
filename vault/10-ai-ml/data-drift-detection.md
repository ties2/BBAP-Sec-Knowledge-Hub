---
title: Data Drift Detection
type: note
tags: [ai-ml, mlops, data-drift, monitoring]
status: learning
sources: []
---

## Summary
Data drift detection is the process of identifying when the statistical properties of the target variable or input data change over time. In a production environment, this change causes a previously learned model to become inaccurate or unusable because the data it is serving predictions on no longer matches the data it was trained on.

## Key Points
* **Types of Drift:**
  * **Concept Drift (Real Drift):** The underlying relationship between the input features and the target variable changes (Pesaranghader et al., 2018).
  * **Covariate Shift (Virtual Drift):** The distribution of the input features changes, but the fundamental relationship with the target remains the same.
* **Standard Detection Methods:**
  * **Performance Tracking:** Monitoring error rates dynamically using statistical process control. For example, a system can set warning and drift levels based on the standard deviation of error rates across an incoming stream of data points (Gama et al., 2004). If the error rate crosses the drift threshold, the model is retrained.
  * **Window-Based Approaches:** Sliding a window over recent prediction results and comparing the mean error inside the window with past historical performance. Methods utilizing statistical bounds, such as McDiarmid's inequality, can be used to mathematically declare when a significant drift has occurred (Pesaranghader et al., 2018).
  * **Statistical Two-Sample Tests:** When ground-truth labels are delayed, statistical tests like Maximum Mean Discrepancy (MMD) or Kolmogorov-Smirnov (KS) are often used to directly compare the distribution of the live production features against the original training dataset features.

## Links
* A vital component of [[MLOps]] and continuous model monitoring.
* Highly relevant to the telemetry collected during [[Model Serving]].

## References
Gama, J., Medas, P., Castillo, G., & Rodrigues, P. (2004). Learning with Drift Detection. *Lecture Notes in Computer Science*, 286-295. https://doi.org/10.1007/978-3-540-28645-5_29
Cited by: 2460

Pesaranghader, A., Viktor, H. L., & Paquet, E. (2018). McDiarmid Drift Detection Methods for Evolving Data Streams. *2018 International Joint Conference on Neural Networks (IJCNN)*, 1-9. https://doi.org/10.1109/ijcnn.2018.8489260
Cited by: 147