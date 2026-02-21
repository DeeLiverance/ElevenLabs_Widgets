import ConvAIReplicaClient from './ConvAIReplicaClient';

export const metadata = {
  title: 'ConvAI Widget Replica',
  description: 'Baseline route for replicating ElevenLabs ConvAI widget behavior.',
};

export default function ConvAIReplicaPage() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  return <ConvAIReplicaClient agentId={agentId} />;
}
