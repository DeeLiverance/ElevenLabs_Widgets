![Header image](https://repository-images.githubusercontent.com/1041806291/3bfb7574-9799-43d2-a653-a9f9a680ca0e)

<p align="center">
  ElevenLabs open-source Next.js AI Audio Starter Kit
</p>

## Getting started

1. Clone the repo

```bash
git clone https://github.com/elevenlabs/elevenlabs-nextjs-starter.git
cd elevenlabs-nextjs-starter
```

2. Setup the `.env` file

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`:

- ELEVENLABS_API_KEY: Get your API key from [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) and replace the placeholder.
- IRON_SESSION_SECRET_KEY: Generate a secure secret (32+ characters) and replace `<secret-key-goes-here>`:

  ```bash
  openssl rand -base64 32
  ```

  Example: `IRON_SESSION_SECRET_KEY=7Y3kZ9vL2xQ5fR8hT1wN6pG4cD0sA3jE`

3. Install/run the project

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Capabilities

- Text to Speech (Eleven V3 preview)
- Text to Dialogue (Eleven V3 preview)
- Speech to Text
- Sound Effects
- Text to Music (with Composition Plan)
- Conversational AI

## Technology

- ElevenLabs SDK
- Next.js w/ Turbo + shadcn/ui
- Tailwind CSS v4

## Learn More

- [ElevenLabs Documentation](https://elevenlabs.io/docs) - learn about ElevenLabs features and API.
