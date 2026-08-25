# Automated educational content pipeline

## Goal
Turn a trusted curriculum file into structured, reviewable educational content without allowing generated material to silently become the source of truth.

## Pipeline

```text
Source PDF/Word/Image
        |
        v
Ingest + file validation
        |
        v
Extract/OCR + normalize
        |
        v
Curriculum structure
(grade/subject/unit/lesson/objectives)
        |
        v
Chunk + metadata
        |
        v
Vector Store / File Search
        |
        +--> Lesson generator
        +--> Summary generator
        +--> Question generator
        +--> Quiz generator
        +--> Study-plan generator
        |
        v
Grounding evaluator
        |
   +----+----+
   |         |
 FAIL      PASS
   |         |
 regenerate  v
        Human review
             |
             v
          Publish
```

## Required metadata
Every chunk and generated lesson should retain, where available:
- curriculum version
- grade
- subject
- unit
- lesson
- page/source identifier
- language
- content type

## Generation contract
Generated content is a derivative artifact. It must never overwrite the original source. Every generated artifact should have a stable ID, source references, schema version, and generation timestamp.

## Evaluation gates
Before publishing:
1. Schema validation.
2. Source-grounding check.
3. Curriculum coverage check.
4. Difficulty/grade check.
5. Duplicate-question check.
6. Answer-key consistency check.
7. Safety/style check.
8. Human review for low-confidence or conflicting content.

## Automation policy
Safe, repeatable transformations can run automatically. Ambiguous source extraction, conflicting curriculum statements, high-impact educational decisions, and publication of a new curriculum version require human review.
