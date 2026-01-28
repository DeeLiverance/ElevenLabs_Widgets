import { Suspense } from 'react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';

import VoiceAgentClient from './VoiceAgentClient';

export const metadata = {
  title: 'Voice Agent Widget',
  description: 'White-label voice agent widget built with the ElevenLabs React SDK.',
};

export default function VoiceAgentPage() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <VoiceAgentClient agentId={agentId} />
    </Suspense>
  );
}
