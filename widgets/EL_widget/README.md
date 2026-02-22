# EL Widget Playground (ConvAI Replica)

This app is our local playground for designing branded ElevenLabs Conversational AI widgets and saving reusable client profiles into the repo.

Main route:

- `http://localhost:3000/convai-replica`

## What this playground is for

- Design a branded widget (colors, orb/avatar, company logo, labels, placement, toggles)
- Attach a specific ElevenLabs agent ID
- Save the full widget setup as a reusable client profile
- Reload the same profile later on any workstation after `git pull`

## Quick Start

1. Go to the widget app

```powershell
cd "widgets/EL_widget"
```

2. Install `pnpm` (if needed)

If `pnpm` is not recognized in PowerShell:

```powershell
corepack enable
corepack prepare pnpm@10.28.1 --activate
```

Fallback:

```powershell
npm install -g pnpm
```

3. Install dependencies

```powershell
pnpm install
```

4. Create `.env` (first run)

```powershell
Copy-Item .env.example .env
```

5. Configure `.env`

Required/used values:

- `IRON_SESSION_SECRET_KEY` (required, minimum 32 chars)
- `ELEVENLABS_API_KEY` (needed for ElevenLabs-backed features)
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (optional default agent for the playground)

6. Start dev server

```powershell
pnpm dev
```

Open:

- `http://localhost:3000/convai-replica`

## Daily Workflow (Playground)

1. Open `/convai-replica`
2. Pick a `Repo preset` and click `Apply preset` (optional starting point)
3. Set the `ElevenLabs agent ID` for the client
4. Configure branding:
- colors / orb colors
- avatar image
- company logo image and offsets
- labels / helper text / provider text
- layout + placement + behavior toggles
5. Save the client profile to the repo:
- `Save brand profile` (portable JSON draft)
- `Save TS preset` (typed preset for production-style reuse)
6. Commit the saved profile files and any brand assets

## What Gets Saved (and What Does Not)

Saved in brand profiles:

- `agentId`
- avatar image URL / uploaded avatar data URL
- company logo URL / uploaded logo data URL
- color/theme/orb settings
- layout/placement/variant settings
- text/chat behavior toggles
- provider footer branding and powered-by override
- input box tuning values

Not saved in brand profiles:

- `ELEVENLABS_API_KEY`
- `IRON_SESSION_SECRET_KEY`

Secrets stay in `.env` and should not be committed.

## Where Profiles Are Stored

Source-controlled profile locations:

- `brand-profiles/repo-json/`
  - Portable JSON profiles saved from the playground (`Save brand profile`)
- `brand-profiles/generated/`
  - Auto-generated typed TS presets saved from the playground (`Save TS preset`)
- `brand-profiles/*.ts`
  - Curated/manual presets (for long-term maintained client profiles)
- `public/brands/`
  - Logo/avatar files (if you store images as files instead of data URLs)

See also:

- `widgets/EL_widget/brand-profiles/README.md`

## Reloading Existing Client Schemas

Yes, this is supported after stopping/restarting dev, as long as the profile files are committed.

To reload a client:

1. `git pull`
2. `pnpm dev`
3. Open `/convai-replica`
4. Use either:
- `Repo brand profiles (logos included)` + `Load brand profile` (JSON profiles)
- `Repo preset` + `Apply preset` (typed presets)

This restores the client widget design without re-toggling settings (except secrets in `.env`).

## Browser Draft vs Repo Save (Important)

The playground has both:

- `Save draft (browser)` / `Load draft`
  - Local browser storage only (not portable)
- `Save brand profile`
  - Saves to repo (`brand-profiles/repo-json`) and is portable via Git
- `Save TS preset`
  - Saves a typed preset file (`brand-profiles/generated`) for code reuse

For team use and scaling, use repo save options, not browser draft only.

## Verification Commands

```powershell
pnpm lint
pnpm build
```

## Troubleshooting

### `pnpm` is not recognized

Use:

```powershell
corepack enable
corepack prepare pnpm@10.28.1 --activate
```

### Duplicate preset key warning (example: `biotune`)

Cause:

- Two presets share the same `id`

Fix:

- Use unique IDs for new presets (for example `wingspanai`, `clientname-v2`)
- Remove or rename duplicate generated presets if needed

### Widget loads but does not connect

Check:

- `ElevenLabs agent ID` is set correctly
- `.env` contains valid `ELEVENLABS_API_KEY` (when required)
- Agent permissions/config in ElevenLabs are correct

## Notes for Handoff to Another Dev Team

To move a client widget setup into another project, hand over:

- brand profile file(s) from `brand-profiles/repo-json` and/or `brand-profiles/generated`
- any image assets from `public/brands`
- the widget wrapper/component integration code (`components/elevenlabs/convai-widget-embed.tsx`)
- required `.env` keys (without sharing actual secrets in Git)
