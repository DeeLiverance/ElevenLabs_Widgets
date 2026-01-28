'use client';

import { ConversationBar, type ConversationBarProps } from '@/components/elevenlabs/conversation-bar';

export type ELCloneVoiceWidgetProps = ConversationBarProps;

export function ELCloneVoiceWidget(props: ELCloneVoiceWidgetProps) {
  return <ConversationBar {...props} />;
}
