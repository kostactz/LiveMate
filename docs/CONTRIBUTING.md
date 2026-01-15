# Contributing to LiveMate

First off, thank you for considering contributing to LiveMate! Your help is essential for keeping it great.

This document provides guidelines for contributing to the project. Please feel free to propose changes to this document in a pull request.

## How to Contribute

We welcome contributions in various forms, including:
- Reporting bugs
- Suggesting enhancements
- Submitting pull requests for bug fixes or new features
- Improving documentation

### Reporting Bugs

If you find a bug, please create an issue in our issue tracker. A good bug report should be as detailed as possible, including:
- A clear and descriptive title.
- Steps to reproduce the bug.
- Expected behavior vs. actual behavior.
- Screenshots or screen recordings, if applicable.
- Information about your environment (e.g., browser, OS).

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, please create an issue. This allows for discussion before any development work begins.

## Development Workflow

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** to your local machine.
3.  **Create a new branch** for your changes: `git checkout -b feature/your-feature-name` or `fix/bug-name`.
4.  **Make your changes**, adhering to the coding conventions outlined below.
5.  **Commit your changes** with a clear and descriptive commit message.
6.  **Push your branch** to your fork on GitHub.
7.  **Create a pull request** from your fork to the main LiveMate repository.

## Pull Request Guidelines

To ensure a smooth and efficient review process, please follow these guidelines when submitting a pull request:

-   **Clear Title:** Write a clear, concise title that summarizes the change. Use the same commit type prefixes (e.g., `feat:`, `fix:`, `docs:`).
-   **Link to Issues:** If your PR addresses an existing issue, link it in the description by including `Fixes #123` or `Closes #123`. This helps with tracking and automatically closes the issue upon merging.
-   **Detailed Description:**
    -   **The "What":** Briefly describe the changes you made.
    -   **The "Why":** Explain the motivation for the change. Why was it necessary? What problem does it solve?
    -   **How to Test:** Provide clear steps for the reviewer to test and verify your changes.
-   **Keep It Focused:** Submit small, focused pull requests that address a single issue or feature. Large PRs are difficult and time-consuming to review.
-   **Draft Pull Requests:** If your work is in progress but you'd like early feedback, open a **Draft** pull request. This indicates that it's not yet ready for a final review.
-   **Review Process:** All pull requests require at least one approval from a core contributor before they can be merged. Be prepared to address feedback and make changes to your submission.

### Pull Request Template

To streamline the process, use the following template when creating a pull request:

```
# Pull Request Title

## Description
- What changes are introduced in this PR?
- Why are these changes necessary?
- Include any relevant context or background information.

## Related Issues
- Link to any related issues (e.g., `Fixes #123`, `Closes #456`).

## Changes Made
- List the key changes made in this PR.
  - Change 1
  - Change 2

## How to Test
- Provide clear steps for testing the changes.
  1. Step 1
  2. Step 2

## Screenshots (if applicable)
- Add screenshots or screen recordings to demonstrate the changes visually.

## Checklist
- [ ] I have read the contributing guidelines.
- [ ] I have added tests for my changes (if applicable).
- [ ] I have documented my changes (if applicable).
- [ ] My changes do not introduce new linting errors.

## Notes for Reviewers
- Add any additional notes or context for the reviewers.
```

## Naming and Commit Conventions

### Branch Naming

-   **Features:** `feature/<kebab-case-feature-name>` (e.g., `feature/inline-ai-suggestions`)
-   **Fixes:** `fix/<kebab-case-bug-name>` (e.g., `fix/preview-scroll-jump`)
-   **Chores/Refactoring:** `chore/<kebab-case-task-name>` (e.g., `chore/refactor-state-management`)

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This makes the commit history easier to read and helps automate changelog generation.

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<type>(<scope>): <short summary>
<BLANK LINE>
<longer description, if necessary>
<BLANK LINE>
<footer, e.g., "Fixes #123">
```

-   **type**: Must be one of the following:
    -   `feat`: A new feature.
    -   `fix`: A bug fix.
    -   `docs`: Documentation only changes.
    -   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
    -   `refactor`: A code change that neither fixes a bug nor adds a feature.
    -   `perf`: A code change that improves performance.
    -   `test`: Adding missing tests or correcting existing tests.
    -   `chore`: Changes to the build process or auxiliary tools.

-   **scope** (optional): A noun describing the section of the codebase affected (e.g., `preview`, `editor`, `ai`, `deps`).

**Example:**
```
feat(editor): add inline AI text generation on selection

Implements a popover menu that appears when a user highlights text,
offering several AI-powered actions like "summarize" and "expand".

Fixes #42
```

## Coding Conventions

### General

-   **TypeScript**: All new code should be written in TypeScript. Use strict mode and avoid using `any` unless absolutely necessary.
-   **React**: Use functional components with hooks. Avoid class components.
-   **Formatting**: We use Prettier for automatic code formatting. Please ensure you run it before committing.
-   **Linting**: We use ESLint. Ensure your code has no linting errors.

### Component Structure

-   Keep components small and focused on a single responsibility.
-   Separate complex logic into custom hooks (`src/hooks/`).
-   UI components should be stateless whenever possible, with state managed by parent components or hooks.

## Best Coding Practices

### General
- Write clear, self-documenting code. Use comments sparingly for complex or non-obvious logic.
- Use TypeScript for all new code. Avoid using `any` unless absolutely necessary.
- Follow the DRY (Don't Repeat Yourself) principle to reduce code duplication.
- Use meaningful variable and function names that convey intent.
- Write modular, reusable code by breaking down large functions or components into smaller, focused units.

### React
- Use functional components with hooks. Avoid class components.
- Manage state using React's built-in hooks or context API where appropriate.
- Use `useMemo` and `useCallback` to optimize performance for expensive calculations or functions.
- Keep components small and focused on a single responsibility.
- Use the provided UI components from `src/components/ui` for a consistent look and feel.

### Testing
- Write unit tests for all new features and bug fixes.
- Use Jest and React Testing Library for testing React components.
- Ensure tests cover edge cases and error handling scenarios.
- Mock external dependencies to isolate the functionality being tested.

### Code Reviews
- Review code for readability, maintainability, and adherence to coding standards.
- Provide constructive feedback and suggest improvements where necessary.
- Ensure all code changes are accompanied by appropriate tests and documentation.

### Bad Practices

### General
- Avoid committing commented-out code. Use version control to track changes instead.
- Do not use magic numbers or strings. Define constants with meaningful names.
- Avoid deeply nested code structures. Refactor to improve readability.
- Do not ignore compiler or linter warnings. Address them promptly.

### React
- Avoid directly manipulating the DOM. Use refs only when necessary as an escape hatch.
- Do not place business logic directly inside UI components. Abstract it to hooks or utility functions.
- Avoid using state unnecessarily. Prefer derived state where possible.
- Do not perform expensive calculations directly in the render body of a component. Use `useMemo` to optimize.

### Testing
- Avoid writing tests that are tightly coupled to implementation details.
- Do not skip writing tests for new features or bug fixes.
- Avoid flaky tests that produce inconsistent results.

### Code Reviews
- Do not approve code without thoroughly reviewing it.
- Avoid nitpicking minor issues that do not impact functionality or readability.
- Do not merge code that introduces new linting errors or test failures.

Thank you for helping make LiveMate better!
