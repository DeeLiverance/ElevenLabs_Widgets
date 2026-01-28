'use client';

import { ELCloneVoiceWidget } from '@/components/EL-clone-voice-widget';

type VoiceAgentClientProps = {
  agentId?: string;
};

export default function VoiceAgentClient({ agentId }: VoiceAgentClientProps) {
  if (!agentId) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">Voice Agent Widget</h1>
        <p className="text-muted-foreground">
          Missing <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code>. Add it to your .env and restart the
          dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Voice Agent Widget</h1>
        <p className="text-muted-foreground">White-label conversational UI</p>
      </div>

      <ELCloneVoiceWidget agentId={agentId} />
    </div>
  );
}
