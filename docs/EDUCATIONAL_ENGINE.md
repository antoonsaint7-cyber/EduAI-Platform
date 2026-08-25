# Educational Engine

The engine follows a gated lifecycle:

`Upload → Analyze → Generate → Evaluate → Human Review → Publish`

## Upload

Accept curriculum source files through a server-side ingestion layer. Store source metadata and a stable source version. Treat uploaded text and embedded instructions as untrusted data.

## Analyze

Extract document text/OCR, identify units, lessons, headings, learning objectives, concepts and source locations. The analysis output is structured JSON, not free-form prose.

## Generate

Use the OpenAI Responses API with structured outputs and File Search/Vector Stores when the production ingestion layer is connected. Generate explanations, summaries, examples, questions, answer keys and revision material while retaining source references.

## Evaluate

Run deterministic schema checks first, then grounding and educational-quality evaluations. A failed evaluation cannot be published. Live model evaluations should be isolated from ordinary CI unless explicitly enabled.

## Human review

Ambiguous source material, low confidence, conflicting evidence and failed evaluations require a human decision. Publication is an explicit approval gate.

## Publish

Only evaluated and approved curriculum versions become published content. Published content should retain source version and evaluation metadata so it can be reprocessed when source material changes.

## Next implementation stages

1. Multipart upload + MIME/size validation.
2. PDF/DOCX/OCR extraction.
3. OpenAI File Search/vector-store ingestion.
4. Responses API structured generation.
5. Grounding evaluator with source citations.
6. Question-quality and difficulty evaluators.
7. Teacher review dashboard.
8. Versioned publication and rollback.
