# Educational Engine Phase 3

Phase 3 adds production-oriented curriculum lifecycle primitives:

`Draft → Evaluated → Awaiting Teacher Review → Published`

## Versioning

Every generated curriculum can be stored as an immutable version record with source version, source metadata, evaluation result, reviewer and publication timestamp. The current implementation uses an in-process store as a safe development boundary; production should replace it with PostgreSQL/SQLite via a repository interface.

## Review gate

- A version starts as `draft`.
- Evaluation attaches a result.
- Only a `passed` evaluation moves it to `awaiting-review`.
- Publication requires explicit teacher approval.
- Failed or unreviewed versions cannot be published.

## Production hardening

Before public launch, persist these records in a database, add authenticated teacher roles, audit logs, source hashes, rollback/version selection, and a review UI. Do not expose provider credentials or internal vector-store IDs to students.

## Grounding evaluator contract

A production evaluator should score every generated lesson on:

1. Source support: each factual claim has one or more source references.
2. Completeness: required learning objectives are covered.
3. Contradiction: generated claims do not conflict with retrieved evidence.
4. Educational quality: age/grade appropriateness and clarity.
5. Question quality: answerability, difficulty and source support.

A threshold failure blocks publication and sends the version back for regeneration or teacher review.
