# ElevenLabs Widgets Workspace

This repo is a workspace that houses multiple ElevenLabs widget-related projects.
Upstream dependencies live in `vendor/` as git submodules, and our custom tools
live in `widgets/`.

## Projects

- `vendor/EL_ui/`
  - Submodule: `https://github.com/elevenlabs/ui`
  - UI component source (Orb, waveforms, etc.)
- `vendor/EL_nextjs-starter/`
  - Submodule: `https://github.com/elevenlabs/elevenlabs-nextjs-starter`
  - Runnable Next.js starter with Conversational AI SDK
- `widgets/`
  - Home for our custom widget tools (add new projects here)

## Working With These Repos

- Clone this repo with submodules:
  - `git clone <this-repo-url>`
  - `git submodule update --init --recursive`
- Update a submodule:
  - `cd` into the submodule and run `git pull`, then commit the updated pointer
    in this repo.
- Re-apply branding overrides after vendor updates:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\apply-branding-overrides.ps1`
  - Check drift only: `powershell -ExecutionPolicy Bypass -File .\scripts\apply-branding-overrides.ps1 -CheckOnly`
- Run a project:
  - Follow the README inside each folder for prerequisites and commands.
