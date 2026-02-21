export type ConvAIReplicaPresetSettings = {
  agentId: string;
  variant: 'tiny' | 'compact' | 'expanded' | 'full';
  placement: 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';
  conversationMode: 'voice-and-text' | 'voice-only' | 'chat-mode';
  dismissible: boolean;
  actionText: string;
  expandText: string;
  orbDebug: boolean;
  avatarImageUrl: string;
  secondaryLogoUrl: string;
  secondaryLogoSize: number;
  secondaryLogoOffsetX: number;
  secondaryLogoOffsetY: number;
  secondaryLogoRounded: boolean;
  secondaryLogoShadow: boolean;
  useOrbColors: boolean;
  avatarOrbColor1: string;
  avatarOrbColor2: string;
  useWidgetThemeColors: boolean;
  widgetBaseColor: string;
  widgetBasePrimaryColor: string;
  widgetBaseBorderColor: string;
  widgetBaseSubtleColor: string;
  widgetAccentColor: string;
  widgetAccentPrimaryColor: string;
  dynamicVariablesInput: string;
};

export type ConvAIReplicaPreset = {
  id: string;
  label: string;
  description: string;
  settings: Partial<ConvAIReplicaPresetSettings>;
};

export const convaiReplicaPresets: readonly ConvAIReplicaPreset[] = [
  {
    id: 'biotune',
    label: 'BioTune',
    description:
      'BioTune baseline branding preset. Update logo/image URLs here to keep them source-controlled.',
    settings: {
      variant: 'full',
      placement: 'bottom-right',
      conversationMode: 'voice-and-text',
      dismissible: true,
      actionText: 'Talk to interrupt',
      expandText: 'Welcome Need Help?',
      orbDebug: false,
      avatarImageUrl: '',
      secondaryLogoUrl: '',
      secondaryLogoSize: 42,
      secondaryLogoOffsetX: 18,
      secondaryLogoOffsetY: 51,
      secondaryLogoRounded: true,
      secondaryLogoShadow: true,
      useOrbColors: true,
      avatarOrbColor1: '#16A34A',
      avatarOrbColor2: '#14B8A6',
      useWidgetThemeColors: true,
      widgetBaseColor: '#F0FDF4',
      widgetBasePrimaryColor: '#14532D',
      widgetBaseBorderColor: '#86EFAC',
      widgetBaseSubtleColor: '#15803D',
      widgetAccentColor: '#15803D',
      widgetAccentPrimaryColor: '#F0FDF4',
      dynamicVariablesInput: '{\n  "source": "convai-replica",\n  "build": "biotune"\n}',
    },
  },
] as const;
