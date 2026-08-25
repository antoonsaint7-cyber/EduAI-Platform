# Voice AI Assistant 2.0

## Architecture

The application is designed around three layers:

1. Browser UI: Arabic-first responsive interface, text chat, voice controls, local preferences.
2. Server: protects API credentials, validates requests, manages conversations, exposes safe tool endpoints.
3. OpenAI: Responses API for reasoning/tools and Realtime API for low-latency voice sessions.

## Planned capabilities

- Realtime voice over WebRTC with ephemeral client authorization.
- Responses API with streaming.
- Web search for current information.
- File search over user-provided study material.
- Function calling for application actions.
- Conversation state and optional persistent memory.
- Teacher mode and student tutoring mode.
- Usage limits, request logging, rate limiting and error handling.

## Security

The permanent OpenAI API key must remain server-side. Browser sessions receive only short-lived/ephemeral authorization where supported. Secrets must be configured through deployment environment variables, never committed to Git.

## Rollout

1. Stabilize the existing text chat.
2. Add Responses API streaming and tools.
3. Add file upload/vector-store workflow.
4. Add WebRTC Realtime voice.
5. Add authentication and persistent conversation storage.
6. Add educational modes and observability.
