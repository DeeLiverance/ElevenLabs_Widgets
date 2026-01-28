# Voice Agent Widget Product Plan

## Vision
Deliver a customizable, embeddable ElevenLabs voice agent widget that mirrors the official experience (orb + call button + chat input) while allowing rapid iteration on styling, behavior, and agent routing.

## Goals
- Clone the “Voice Chat 02/03” experience from ElevenLabs UI with minimal setup.
- Keep API credentials server-side; expose only `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` to the client.
- Provide toggles/hooks for experimental features (language selector, on/off switch, theme variants).
- Ship install instructions so any Next.js project can drop it in.

## User Stories
1. **Product designer**: "I want to brand the widget (colors, illustrations) without rewriting logic."
2. **Engineer**: "I need a working voice agent UI in under 10 minutes for demos."
3. **Solutions team**: "I want to swap agent IDs or endpoints per deployment without redeploying UI code."

## Technical Stack
- Next.js 15 + App Router (already in `widgets/EL_widget`)
- ElevenLabs UI components installed via CLI: `npx @elevenlabs/cli@latest components add voice-chat-02`
- ElevenLabs React SDK (`@elevenlabs/react`) for `useConversation` hooks
- Tailwind CSS + shadcn primitives, matching the starter kit

## Environment & Config
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: public agent ID for the conversation endpoint
- Server-side session: `IRON_SESSION_SECRET_KEY` (already documented in README)
- Optional feature flags (e.g., `NEXT_PUBLIC_WIDGET_THEME=butterfly`)

## Implementation Phases
1. **Bootstrap**
   - Install `voice-chat-02` component set
   - Create `/voice-agent` route that renders the component with default styling
2. **Branding pass**
   - Apply purple gradient shell, butterfly hero, custom icons (per screenshot)
   - Add language selector input + dropdown (stock component from ElevenLabs UI)
3. **Controls & toggles**
   - Add on/off switch (reuse `components/ui/switch.tsx`)
   - Wire button interactions to `useConversation` start/stop, text input send
4. **Extensibility**
   - Expose props for theme, agent ID, button labels
   - Document how to load multiple widgets or variations on the same page

## Testing & Verification
- Manual: run `pnpm dev` and test `http://localhost:3000/voice-agent`
- Smoke test scripts: ensure env vars are validated on boot

## Widget Build Checklist (Reusable)
Copy this checklist for new widgets and reset all boxes to `[ ]`.

- [x] Create widget project from starter template
- [x] Install dependencies (`pnpm install`)
- [x] Create `.env` from `.env.example`
- [ ] Set required env vars (`ELEVENLABS_API_KEY`, `IRON_SESSION_SECRET_KEY`, `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`)
- [ ] Choose UI source (CLI components vs. white-label React SDK)
- [ ] Implement `VoiceWidget` component
- [ ] Add `/voice-agent` demo route
- [ ] Add entry to `lib/demos.ts`
- [ ] Style to match target design
- [ ] Add mic permission + error handling UI
- [ ] If private agent: add signed URL/token endpoint
- [ ] Test locally (`pnpm dev`, then `/voice-agent`)
- [ ] Document usage + configuration
- [ ] Decide integration plan for `R:\Working_Repositories\1.0 next-ai-agency`

## Open Questions
- Do we need multi-agent dropdown (swap agent IDs live)?
- Should we persist chat transcript to a backend for analytics?

## Integration Planning (after first test build)
We will integrate the first widget into `R:\Working_Repositories\1.0 next-ai-agency` after a working
example is running. Please decide:

- Target location in the repo (e.g., `apps/`, `tools/`, `packages/`, etc.)
- Integration method: copy the widget, git submodule, or workspace package
- Desired packaging: standalone app vs. reusable component
- Build/run expectations inside the target repo (scripts, env, CI)

## Next Steps
1. Install the component set via CLI
2. Create `/voice-agent` demo page
3. Customize styling to match provided screenshot
4. Document theming + configuration options in this file

## Reference: Option B (White-label via React SDK)

Option B: Clone the widget UI and fully white-label it (recommended for you)

Here you build the same experience (orb + call button + text input) using the React SDK. You control
every pixel, so branding is gone. The SDK supports:

startSession({ agentId, connectionType })

endSession()

sendUserMessage(text)

sendUserActivity() (useful while the user is typing so the agent doesn’t interrupt)

Step 1: Install the SDK
npm i @elevenlabs/react

Step 2: Build a “lookalike widget” component (call + text)

<details><summary><code>app/components/VoiceWidget.tsx</code></summary>

```tsx
"use client";

import { useMemo, useState } from "react";
import { useConversation } from "@elevenlabs/react";

type Props = {
  agentId: string;              // from ElevenLabs UI
  logoUrl?: string;             // your logo / butterfly
};

export function VoiceWidget({ agentId, logoUrl = "/butterfly.png" }: Props) {
  const [text, setText] = useState("");

  const conversation = useConversation({
    onMessage: (msg) => {
      // Optional: capture transcripts/agent replies for your own chat log UI
      // msg can be tentative/final transcriptions, agent replies, debug, etc.
      // Keep this minimal for now.
      // console.log(msg);
    },
  });

  const isConnected = conversation.status === "connected";

  const onToggleCall = async () => {
    if (!isConnected) {
      // Ask mic permission before starting (recommended by docs)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId,
        connectionType: "webrtc", // or "websocket"
        // userId: "optional-end-user-id",
      });
    } else {
      await conversation.endSession();
    }
  };

  const onSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await conversation.sendUserMessage(trimmed);
    setText("");
  };

  return (
    <div className="w-[320px] rounded-3xl bg-purple-700 p-4 text-white shadow-xl">
      <div className="flex items-center justify-end text-sm opacity-90">
        <span className="mr-1">English</span>
        <span className="opacity-80">▾</span>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className="relative h-40 w-40">
          <img
            src={logoUrl}
            alt="logo"
            className="h-full w-full rounded-full object-contain"
          />
        </div>

        <button
          onClick={onToggleCall}
          className="mt-4 h-14 w-14 rounded-full bg-black/70 text-xl"
          aria-label={isConnected ? "End call" : "Start call"}
        >
          📞
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/25 bg-white/10 p-3">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            conversation.sendUserActivity(); // prevents interruptions while typing
          }}
          placeholder="Send a message..."
          className="w-full bg-transparent outline-none placeholder:text-white/60"
        />

        <div className="mt-3 flex justify-end">
          <button
            onClick={onSend}
            className="h-10 w-10 rounded-full bg-black/40"
            aria-label="Send message"
          >
            ▲
          </button>
        </div>
      </div>
    </div>
  );
}
```

</details>

Step 3: Use it on a page
import { VoiceWidget } from "@/app/components/VoiceWidget";

export default function Page() {
  return <VoiceWidget agentId={process.env.NEXT_PUBLIC_AGENT_ID!} />;
}

Step 4: Public vs private agent (important)

If your agent is public (no auth), you can start sessions with just agentId.

If your agent requires auth, you must generate a signed URL server-side using your ElevenLabs API key
(never expose it in the browser). The docs show the exact /get-signed-url flow
