---
title: Model Serving
type: note
tags: [ai-ml, mlops, deployment]
status: learning
sources: []
---

## Summary
The process of hosting a trained machine learning model in a production environment so it can accept inputs and return predictions (inference) via an API.

## Key points
* Exposes models as scalable REST or gRPC endpoints.
* Critical metrics include latency (response time) and throughput (requests per second).
* Common tools: FastAPI, TensorFlow Serving, TorchServe, Triton Inference Server.

## Links
* Core component of [[MLOps]]
* Used to deploy [[Transformers]] and other trained models.