---
title: Data Version Control (DVC) 
Explained: The Core of Reproducible MLOps
type: note
tags: [mlops, dvc, machine-learning, version-control, automation]
status: review
sources:
  - xFusionCorp Industries ML Exercises
---
## Summary
Data Version Control (DVC) is an open-source system designed to manage and track machine learning projects. It acts as an extension to Git, solving the problem of versioning large datasets and models. By decoupling code, data, and parameters into a structured pipeline, DVC ensures that every machine learning experiment is fully reproducible, trackable, and easy to collaborate on without overloading the Git repository.

## Key points
- **Pipelines and DAGs (`dvc.yaml`):** DVC organizes ML workflows into discrete stages (e.g., `process_data`, `train`). Each stage explicitly defines its execution command (`cmd`), dependencies (`deps`), and outputs (`outs`). This allows DVC's smart execution engine to only rerun stages that have changed, saving compute time.
- **Parameter Management (`params.yaml`):** Hyperparameters (like `n_estimators`) are decoupled from Python code. By defining them in `params.yaml` and wiring them to the pipeline, experiments can be modified and tracked purely through configuration changes.
- **Metrics Tracking (`metrics.json`):** Model performance metrics (like accuracy and F1 score) can be output to a JSON file. Defining this in `dvc.yaml` with `cache: false` ensures Git tracks the plain-text history of these metrics directly, which can be viewed using `dvc metrics show`.
- **Reproducibility (`dvc.lock`):** Every successful pipeline run updates the lock file with cryptographic hashes of the exact data, code, and parameters used. Committing this file to Git guarantees anyone can identically reproduce the specific model.

## Links
- Core backbone of [[MLOps]] and reproducible experiments
- Extends the capabilities of standard [[Git]] workflows
- Integrates with remote storage backends like [[AWS S3]]