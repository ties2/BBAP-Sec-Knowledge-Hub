---
title: CI/CD 
Explained: The DevOps Skill That Makes You 10x More Valuable
type: note
tags: [devops, ci-cd, automation, software-engineering]
status: review
sources: 
  - https://www.youtube.com/watch?v=AknbizcLq4w
---
## Summary
This video breaks down the concepts of Continuous Integration and Continuous Deployment (CI/CD) by comparing a painful, manual release process to a fully automated pipeline. It highlights how implementing CI/CD eliminates manual bottlenecks, minimizes deployment anxiety, and increases release frequency through automated testing and modern deployment strategies.

## Key points
- **Continuous Integration (CI):** Encourages developers to commit smaller code changes more frequently. Automated tests are run on every commit to catch and isolate bugs early, which avoids massive merge conflicts and broken main branches [00:05:40].
- **Build Automation:** Tools like Jenkins, GitHub Actions, or GitLab CI automate the process of building artifacts (like Docker images), tagging them, and pushing them to registries once tests pass [00:08:41].
- **Automated Testing:** Thorough end-to-end, integration, and security tests should be run within the pipeline against a running environment to remove the need for stressful manual testing sessions [00:12:15].
- **Continuous Delivery vs. Deployment:** Continuous *Delivery* automates the release process up to a staging/pre-production environment [00:14:11]. Continuous *Deployment* takes it a step further by automating the release all the way into production, sometimes with just a single-click manual approval for business stakeholders [00:16:39].
- **Risk-Reduction Deployment Strategies:** - **Canary Deployments:** Progressively rolling out a new version to a small subset of users (e.g., 1%, then 10%) to monitor for issues before a 100% rollout [00:17:57].
  - **Blue-Green Deployments:** Maintaining two identical environments. Traffic is switched to the new version (green), but can be immediately routed back to the old version (blue) if things go wrong [00:18:47].

## Links
- Core backbone of [[DevOps]] workflows
- Integrates with containerization tools like [[Docker]] and [[Kubernetes]]