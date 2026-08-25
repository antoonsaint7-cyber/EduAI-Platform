# Implementation checklist

## Responses API
- Use the Responses API for text reasoning and tool use.
- Enable streaming for incremental UI updates.
- Pass conversation state using a server-managed conversation identifier or previous response identifiers.

## Web search
- Expose web search only when the request needs current information.
- Render source citations/links in the UI.

## File search
- Create a vector store per user or course.
- Upload supported documents from the server.
- Attach file_search to Responses requests.
- Never expose provider credentials to the browser.

## Realtime voice
- Prefer WebRTC for browser voice.
- Generate short-lived/ephemeral authorization server-side.
- Keep the standard API key server-side.
- Provide mute, stop, connection state and graceful fallback to text chat.

## Production hardening
- Add authentication before persistent personal data is enabled.
- Add per-user rate limits and usage accounting.
- Validate input size and content type.
- Add structured logs without storing sensitive audio or document content by default.
- Add health checks and automated tests.

## Education
- Teacher mode: direct explanations, lesson plans, quizzes and document-grounded answers.
- Student mode: Socratic hints, progressive disclosure and feedback rather than immediate solutions.
