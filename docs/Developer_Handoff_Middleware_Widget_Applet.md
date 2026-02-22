# Developer Handoff: ConvAI Widget Playground Applet (Middleware Team)

## Purpose

This applet is a branded widget playground for ElevenLabs Conversational AI.

It lets us:

- design client-specific widget UI/branding
- attach a specific ElevenLabs `agentId`
- save the full configuration as a reusable profile in source control
- reload the same client profile later without re-toggling settings

Primary route:

- `widgets/EL_widget` -> `http://localhost:3000/convai-replica`

## What You Are Receiving

The applet includes:

- widget embed wrapper logic (`convai-widget-embed.tsx`)
- a ConvAI replica playground UI (`/convai-replica`)
- repo-backed client brand profile storage
- typed preset export for production-style reuse

## Why This Matters for Middleware

This enables your team to host and reuse a consistent branded widget configuration across websites.

Typical middleware use:

- maintain approved client widget profiles in Git
- deploy a single app/service that can load a profile by `brandId`
- embed the widget into websites (direct component, route, or iframe strategy)

## Source-Controlled Client Profiles (Portable)

Do not rely on browser draft saves for production workflows.

Use repo-backed profiles:

- JSON drafts: `widgets/EL_widget/brand-profiles/repo-json/`
- Typed presets: `widgets/EL_widget/brand-profiles/generated/`
- Curated presets: `widgets/EL_widget/brand-profiles/*.ts`
- Brand assets: `widgets/EL_widget/public/brands/`

These are portable across workstations after `git pull`.

## What Is Included in a Saved Profile

Saved in profile schema:

- `agentId`
- avatar image URL / uploaded image data URL
- company logo URL / uploaded image data URL
- colors and orb colors
- labels and widget text settings
- layout / placement / variant
- text/chat behavior toggles
- provider footer branding (text/url/icon)
- powered-by override text
- input box tuning values

Not saved in profile schema:

- `ELEVENLABS_API_KEY`
- `IRON_SESSION_SECRET_KEY`

Those remain environment variables.

## Local Run (for Middleware Team)

From repo root:

```powershell
cd "widgets/EL_widget"
```

Install dependencies:

```powershell
pnpm install
```

If `pnpm` is not installed:

```powershell
corepack enable
corepack prepare pnpm@10.28.1 --activate
```

Create env file:

```powershell
Copy-Item .env.example .env
```

Required env values:

- `IRON_SESSION_SECRET_KEY` (required, 32+ chars)
- `ELEVENLABS_API_KEY` (required for ElevenLabs-backed features)
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (optional default only; profile can override with saved `agentId`)

Start dev server:

```powershell
pnpm dev
```

Open:

- `http://localhost:3000/convai-replica`

## How to Use the Playground (Team Workflow)

1. Load an existing client:
- `Repo brand profiles (logos included)` -> `Load brand profile`
- or `Repo preset` -> `Apply preset`

2. Update branding/config as needed:
- logos / avatar
- colors
- labels
- behavior toggles
- agent ID

3. Save back to repo:
- `Save brand profile` (JSON profile)
- `Save TS preset` (typed preset)

4. Commit and push:
- profile files
- any image assets in `public/brands`

## Middleware Integration Recommendation

Use profiles as configuration, not hardcoded UI values.

Recommended approach:

1. Choose a `brandId` (for example `wingspanai`, `biotune`)
2. Load the corresponding repo profile
3. Pass its `settings` into the widget wrapper/component
4. Keep API keys in middleware environment config only

This gives you reproducible widgets per client with minimal manual setup.

## Handoff Contract (What to Copy Into Another Repo)

If you are importing this into another project:

- `widgets/EL_widget/components/elevenlabs/convai-widget-embed.tsx`
- `widgets/EL_widget/brand-profiles/` (including `generated/` and `repo-json/` if needed)
- `widgets/EL_widget/public/brands/`
- any route/page integration code that renders the widget

Exclude:

- `.next/`
- `node_modules/`
- `.env` secrets

## Operational Notes

- Duplicate preset IDs can cause React key warnings in the dropdown (example: `biotune` duplicated in built-in + generated preset). Use unique IDs for new presets.
- Browser draft save/load is for local experimentation only; it is not portable.
- Repo-backed profile saves are intended for scaling and team handoff.

## Minimum Acceptance Checklist (Middleware Team)

- Can run `widgets/EL_widget` locally
- Can open `/convai-replica`
- Can load an existing repo brand profile
- Can start the widget using the saved `agentId`
- Can save profile changes and see files updated in Git
- Can reload the same profile after stopping/restarting dev
