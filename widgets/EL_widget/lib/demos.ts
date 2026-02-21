import {
  AudioLines,
  MessageSquareQuote,
  MessagesSquare,
  Music,
  PhoneCall,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

type Demo = {
  name: string;
  slug: string;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
};

export const demos: { name: string; items: Demo[] }[] = [
  {
    name: 'Capabilities',
    items: [
      {
        name: 'Text to speech',
        icon: MessageSquareQuote,
        slug: 'text-to-speech',
        description: 'Convert text to natural-sounding speech.',
      },
      {
        name: 'Speech to text',
        icon: AudioLines,
        slug: 'speech-to-text',
        description: 'Transcribe audio and video files with high accuracy.',
      },
      {
        name: 'Text to dialogue',
        icon: Users,
        slug: 'text-to-dialogue',
        description: 'Create conversations between multiple voices.',
      },
      {
        name: 'Sound effects',
        icon: Sparkles,
        slug: 'sound-effects',
        description: 'Turn text into cinematic sound effects.',
      },
      {
        name: 'Music',
        icon: Music,
        slug: 'music',
        description: 'Generate music compositions from text prompts.',
      },
      {
        name: 'Conversational AI',
        icon: MessagesSquare,
        slug: 'conversational-ai',
        description: 'Build life-like conversational agents.',
      },
      {
        name: 'Voice Agent Widget',
        icon: PhoneCall,
        slug: 'voice-agent',
        description: 'White-label voice agent widget UI.',
      },
      {
        name: 'ConvAI Widget Replica',
        icon: PhoneCall,
        slug: 'convai-replica',
        description: 'Embed-compatible ConvAI widget baseline with host controls.',
      },
    ],
  },
];

export function findDemoBySlug(slug: string): (Demo & { category: string }) | undefined {
  for (const section of demos) {
    const item = section.items.find((item) => item.slug === slug);
    if (item) {
      return { ...item, category: section.name };
    }
  }
  return undefined;
}
