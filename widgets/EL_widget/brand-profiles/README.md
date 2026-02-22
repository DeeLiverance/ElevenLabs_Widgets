# Brand Profiles

Store reusable, source-controlled widget brands here.

## Structure

- `types.ts`: shared types
- `*.ts`: one file per brand profile
- `index.ts`: central export list
- `generated/`: auto-generated typed presets from the playground
- `repo-json/`: playground-saved portable profiles (JSON)

## Add a new brand

1. Duplicate an existing brand file.
2. Update `id`, `label`, `description`, and `settings`.
3. Add the new export in `index.ts`.
4. Put logo/avatar assets in `public/brands/`.

The playground imports profiles from this folder through:
`lib/convai-replica-presets.ts`.

The playground "Save brand profile" action writes JSON files to `repo-json/` via the local Next.js API.
The playground "Save TS preset" action writes typed preset files to `generated/`.
