# ConvAI Widget Replication Implementation Checklist

Date: 2026-02-21
Related PRD: `docs/Product_Development_Plans/PRD_ConvAI_Widget_Replication.md`

## Phase 0: Planning Lock

- [ ] Confirm target UX parity level: baseline vs pixel-level clone.
- [ ] Confirm auth mode: public `agent-id` vs signed URL.
- [ ] Confirm launch scope: internal demo route only vs production embed package.
- [ ] Confirm analytics destination for widget telemetry events.

## Phase 1: Baseline Route (In Progress)

- [x] Add baseline example route at `/convai-replica`.
- [x] Build a reusable ConvAI embed wrapper component.
- [x] Expose baseline runtime controls (variant, dismissible, texts, dynamic variables).
- [x] Add host-side expand/collapse/toggle dispatch controls.
- [x] Add basic event log for `elevenlabs-convai:call`.
- [ ] Validate behavior against the target widget with side-by-side QA notes.

## Phase 2: Configuration Parity

- [ ] Add support for `signed-url` startup path.
- [ ] Add support for `server-location`.
- [ ] Add support for `start-call-text`, `end-call-text`, `listening-text`, `speaking-text`.
- [ ] Add support for prompt/language/voice overrides.
- [ ] Add support for markdown link safety options.
- [ ] Add support for syntax highlight theme override.

## Phase 3: Host Integration Hardening

- [ ] Publish event interface docs (event names and payload contract).
- [ ] Confirm event compatibility for all documented widget events.
- [ ] Add helper utilities for host-side runtime variable updates.
- [ ] Add telemetry hooks for open, start, end, error, and mode switch events.
- [ ] Add retry and user-facing fallback for script load failures.

## Phase 4: Security and Reliability

- [ ] Implement signed URL endpoint for private agents.
- [ ] Validate that no API secrets are exposed in client bundles.
- [ ] Add domain allowlist guidance for deployment.
- [ ] Add markdown link safety defaults and tests.
- [ ] Add error state UX for mic permission denied and network failure.

## Phase 5: Accessibility and QA

- [ ] Keyboard test for launcher, call controls, and message actions.
- [ ] Validate ARIA labels and focus states.
- [ ] Run mobile viewport checks for compact and expanded states.
- [ ] Add manual QA matrix by browser: Chrome, Edge, Safari, Firefox.
- [ ] Confirm dark/light theme rendering and contrast thresholds.

## Phase 6: Release Readiness

- [ ] Write integration guide for downstream projects.
- [ ] Add changelog entry and rollout notes.
- [ ] Decide final route naming and navigation placement.
- [ ] Capture before/after screenshots for stakeholder review.
