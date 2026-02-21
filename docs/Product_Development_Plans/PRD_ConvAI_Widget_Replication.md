# PRD: ElevenLabs ConvAI Widget Replication

Date: 2026-02-21
Status: Draft v1
Owner: EL Widget Team

## 1. Objective

Replicate the behavior and integration contract of the embedded ElevenLabs widget loaded with:

```html
<elevenlabs-convai agent-id="agent_9601keqq8tq3ezbadga3gs1s4hgc"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

The replica should preserve end-user behavior (voice and text interaction), configuration surface (HTML-style options), and host-page integration patterns (events and runtime overrides), while running inside our own Next.js app.

## 2. Goals

- Match core UX and interaction flows of the official widget.
- Support the same high-value configuration options used in embed scenarios.
- Keep agent credentials secure and avoid exposing private secrets client-side.
- Provide a reusable widget component that can be themed and embedded in multiple internal projects.

## 3. Non-Goals

- Rebuild the ElevenLabs dashboard configuration UI.
- Rebuild all internal package features that are not user-visible in web embed usage.
- Replace ElevenLabs agent orchestration or speech model infrastructure.

## 4. Source Baseline

Primary references used for this PRD:

- Widget customization docs (embed, attributes, runtime overrides, client tools).
- ElevenLabs changelog:
  - 2026-02-02 (`@elevenlabs/convai-widget-*` updates, dismissible support).
  - 2026-02-16 (`@elevenlabs/convai-widget-*` status badge/tool status updates).
- `@elevenlabs/convai-widget-core` source type definitions and wrapper behavior:
  - `packages/convai-widget-core/src/types/config.ts`
  - `packages/convai-widget-core/src/widget/Wrapper.tsx`

## 5. Personas and Primary Use Cases

1. Site visitor:
- Starts a voice conversation from a floating launcher.
- Optionally switches to text/chat mode.
- Ends or dismisses the widget.

2. Website owner/product team:
- Embeds quickly with minimal code.
- Configures copy, avatar, colors, language, and runtime context.
- Adds client tools triggered during conversations.

3. Frontend engineer:
- Integrates safely in a host app.
- Subscribes to widget events.
- Controls expansion state programmatically when needed.

## 6. Product Requirements

### 6.1 Core Experience

R-001: Provide a floating widget launcher with expanded conversation panel behavior.

R-002: Support voice call lifecycle states:
- Idle
- Connecting
- Listening
- Speaking
- Ended
- Error

R-003: Support text-capable interaction modes when enabled:
- Voice only
- Voice + text
- Text-only initiation path (chat mode)

R-004: Support dismiss/reopen behavior when `dismissible` is enabled.

R-005: Provide transcript/chat history display within the active session UI.

### 6.2 Configuration Compatibility

R-006: Support these configuration inputs (minimum parity set):
- `agent-id`
- `signed-url` (as alternative auth path)
- `server-location`
- `variant`
- `dismissible`
- `avatar-image-url`
- `avatar-orb-color-1`
- `avatar-orb-color-2`
- `action-text`
- `start-call-text`
- `end-call-text`
- `expand-text`
- `listening-text`
- `speaking-text`
- `dynamic-variables` (JSON)
- `override-language`
- `override-prompt`
- `override-first-message`
- `override-voice-id`
- Markdown safety options:
  - `markdown-link-allowed-hosts`
  - `markdown-link-include-www`
  - `markdown-link-allow-http`
  - `syntax-highlight-theme`

R-007: Allow host app overrides to take priority over dashboard defaults.

R-008: Ensure runtime configuration can be updated before session start without page reload.

### 6.3 Events and Host Integration

R-009: Emit `elevenlabs-convai:call` event during call initialization so host pages can inject client tools.

R-010: Support external expansion control event listener:
- Event: `elevenlabs-agent:expand`
- Detail payload action: `expand`, `collapse`, or `toggle`

R-011: Expose a stable event API surface in docs for app teams (custom event names and detail schema).

### 6.4 Security and Compliance

R-012: For public embed mode, require public agent configuration aligned with ElevenLabs requirements.

R-013: For restricted/private flows, support signed URL/token based startup without exposing API keys in browser code.

R-014: Enforce markdown link safety defaults to reduce phishing risk.

R-015: Respect domain allowlist controls in deployment guidance.

### 6.5 Accessibility

R-016: Keyboard-operable controls for launcher, start/end, mute, text input, send, and dismiss.

R-017: Clear accessible labels for call and message controls.

R-018: Status text updates for connection/listening/speaking/error states.

## 7. UX Requirements

U-001: Widget placement supports common corners and bottom-centered placement.

U-002: Visual variants should include compact and full-style layouts, with responsive behavior for mobile widths.

U-003: Avatar supports orb gradient or image URL.

U-004: Provide clear call-to-action text and in-session status feedback.

U-005: Terms and feedback surfaces should be supported when configured by agent/widget settings.

## 8. Technical Requirements

T-001: Implement as a reusable client component in `widgets/EL_widget` with a clear prop API.

T-002: Keep a thin integration layer for ElevenLabs session start/end/message and connection events.

T-003: Do not store ElevenLabs API key in client-exposed code.

T-004: Add feature flags for:
- `dismissible`
- `text_input_enabled`
- `conversation_mode_toggle_enabled`
- `show_agent_status`

T-005: Add telemetry hooks for:
- Widget opened
- Session started
- Session ended
- Error encountered
- Mode switched (voice/text)

## 9. Open Questions and Risks

Q-001: Variant naming mismatch risk:
- Docs examples show `variant="expanded"`.
- Core type source currently defines variants as `tiny | compact | full`.
- Action: verify runtime accepted values in the exact package version used at implementation time.

Q-002: Event surface completeness:
- Confirm full emitted event catalog for current embed package version beyond documented `elevenlabs-convai:call`.

Q-003: Agent auth mode:
- Confirm whether target deployment requires only public-agent embed or signed URL mode.

## 10. Acceptance Criteria

AC-001: Replica can be mounted on a page and start/end a conversation with the provided `agent-id`.

AC-002: Voice flow works end-to-end (mic permission, connect, converse, end).

AC-003: Text interaction works when enabled and preserves message ordering.

AC-004: Runtime `dynamic-variables` and overrides are passed and observable in agent behavior.

AC-005: Host integration works for:
- `elevenlabs-convai:call` listener
- `elevenlabs-agent:expand` control event

AC-006: Dismissible behavior and re-open button function correctly when enabled.

AC-007: Accessibility smoke pass succeeds for keyboard interaction and ARIA labels.

## 11. Delivery Plan

Phase 1: Baseline replica
- Launcher, panel, voice start/end, error handling.

Phase 2: Configuration parity
- Copy/avatar/style/runtime overrides, markdown safety options.

Phase 3: Integration hardening
- Event API docs, telemetry, accessibility pass, QA matrix.

Phase 4: Rollout
- Add internal demo route and handoff docs for embedding in other projects.

## 12. Suggested Implementation Artifacts

- `components/elevenlabs/replica-widget.tsx`
- `components/elevenlabs/replica-widget-provider.tsx`
- `app/(examples)/convai-replica/page.tsx`
- `docs/convai-replica-integration.md`
- `docs/convai-replica-events.md`
