---
title: GitHub Actions
type: note
tags: [devops, github-actions, ci-cd, docker, automation]
status: review
sources:
  - https://www.youtube.com/watch?v=R8_veQiYBjI
---
## Summary
This tutorial explains the fundamentals of GitHub Actions, clarifying that it is a platform for automating general developer workflows, not just a CI/CD tool. It covers core concepts like events, workflows, and jobs, and walks through a hands-on demonstration of building a CI pipeline for a Java Gradle project. The pipeline tests the code, builds it into a Docker image, and securely pushes it to a private Docker Hub repository.

## Key points
- **More Than Just CI/CD:** GitHub Actions automates various organizational and repository tasks (e.g., assigning issues, auto-commenting on pull requests, managing contributors) so developers can focus on writing code [00:01:08].
- **Core Concepts [00:04:47]:**
  - **Events:** Triggers that start a workflow (e.g., pushing code to a branch, creating a pull request, or opening an issue).
  - **Workflows:** The automated process (defined in a YAML file) that gets executed when an event occurs.
  - **Jobs:** A workflow contains one or more jobs. Jobs run on separate, fresh GitHub-managed servers in parallel (unless configured to wait for another job to finish).
  - **Actions/Steps:** The individual tasks inside a job. You can execute raw command-line scripts using `run`, or leverage pre-built, community-created actions from the GitHub Marketplace using the `uses` attribute.
- **Execution Environments:** GitHub provisions clean, hosted runner servers for jobs. You can specify the OS using `runs-on` (e.g., `ubuntu-latest`, `windows-latest`, `macos-latest`). Ubuntu runners conveniently come with tools like Docker pre-installed [00:22:51].
- **Pipeline Setup & Syntax [00:10:41]:** 
  - Workflows are stored in the `.github/workflows/` directory as `.yml` files. 
  - GitHub provides boilerplate templates based on the language detected in the repository (e.g., Java with Gradle).
  - Using a **Matrix Strategy** allows you to test the application concurrently across multiple operating systems or language versions [00:23:26].
- **Docker Integration [00:24:39]:** 
  - Instead of manually writing `docker build` and `docker push` shell commands, you can use pre-built GitHub Actions from the marketplace specifically designed to authenticate, build, and push Docker images.
- **Managing Secrets [00:29:10]:** To push an image to Docker Hub, the pipeline needs credentials. Plaintext passwords should never be stored in the YAML file. Instead, credentials are saved in the repository's "Settings -> Secrets" panel and referenced securely in the workflow file using the syntax `${{ secrets.SECRET_NAME }}`.

## Links
- Used to automate workflows alongside [[CI/CD]]
- Integrates seamlessly with [[Docker]] for containerization