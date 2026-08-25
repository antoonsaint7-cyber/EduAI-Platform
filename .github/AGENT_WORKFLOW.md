# Agent feature workflow

This repository uses an issue -> feature branch -> validation -> pull request workflow.

## Required lifecycle

1. Start from the latest `main`.
2. Create a dedicated branch named `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, or `docs/<short-name>`.
3. Never commit feature work directly to `main`.
4. Read `AGENTS.md` before editing.
5. Implement only the requested scope.
6. Run the checks in `AGENTS.md` and the relevant CI workflow.
7. Commit with a focused conventional message.
8. Push the feature branch.
9. Open a PR targeting `main`.
10. Put a concise summary, tests, evals, risks, and follow-ups in the PR body.
11. Stop after opening the PR unless explicit repository policy authorizes merge/deploy.

## Branch naming

- `feature/<name>` for product features
- `fix/<name>` for bugs
- `chore/<name>` for tooling/maintenance
- `docs/<name>` for documentation-only work

## PR requirements

Every PR must include:

- What changed
- Why it changed
- Tests executed
- AI evals executed, if applicable
- Security impact
- Known limitations
- Follow-up work

## Safety

The agent must not read, print, commit, or transmit secrets. It must not modify production secrets, deployment credentials, or unrelated branches. Destructive database, billing, account, or production operations require explicit human approval.

## Automation policy

The automation may create branches, commit feature changes, push feature branches, and open draft PRs. It must not push to `main` or merge PRs automatically. GitHub branch protection is the final enforcement layer.
