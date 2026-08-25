# Testing strategy

## Layers

1. Syntax/lint: fast checks on every PR.
2. Unit tests: server utilities, validation, prompt builders, content schemas.
3. Integration tests: API routes with mocked OpenAI responses.
4. Content pipeline tests: extraction, normalization, lesson/question schemas.
5. AI evals: quality and grounding checks against a fixed dataset.
6. Security checks: dependency audit and secret-scan tooling available in CI.

## AI eval principles
- Keep a versioned dataset under `evals/datasets/`.
- Each case has an input, expected behavior, source evidence when relevant, and grading criteria.
- Prefer deterministic graders for schema, citations, forbidden claims, and exact constraints.
- Use model-based grading only for semantic qualities such as clarity and pedagogical usefulness.
- Track pass rate and regressions by category, not only a single aggregate score.
- Live model evals are opt-in in pull requests and scheduled/manual in CI to control cost.

## Minimum quality gates
- No syntax/lint failures.
- Unit/integration tests pass.
- No critical security findings.
- No regression in grounded curriculum-answer score.
- No regression in student-mode safety/pedagogy score.

## Test commands
The canonical commands are exposed through `package.json`. Do not invent a command in CI that is not present in the project.
