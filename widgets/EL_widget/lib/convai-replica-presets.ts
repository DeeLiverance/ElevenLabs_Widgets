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
  {
    id: 'test-brand-alpha',
    label: 'Test Brand Alpha',
    description: 'Test preset with embedded avatar and company logo paths for save/reload checks.',
    settings: {
      variant: 'full',
      placement: 'bottom-right',
      conversationMode: 'voice-and-text',
      dismissible: true,
      actionText: 'Talk with Alpha',
      expandText: 'Alpha support',
      orbDebug: false,
      avatarImageUrl: '/brands/test-brand-alpha-avatar.svg',
      secondaryLogoUrl: '/brands/test-brand-alpha-logo.svg',
      secondaryLogoSize: 40,
      secondaryLogoOffsetX: 16,
      secondaryLogoOffsetY: 51,
      secondaryLogoRounded: true,
      secondaryLogoShadow: true,
      useOrbColors: true,
      avatarOrbColor1: '#0F766E',
      avatarOrbColor2: '#14B8A6',
      useWidgetThemeColors: true,
      widgetBaseColor: '#F0FDFA',
      widgetBasePrimaryColor: '#134E4A',
      widgetBaseBorderColor: '#99F6E4',
      widgetBaseSubtleColor: '#0F766E',
      widgetAccentColor: '#0D9488',
      widgetAccentPrimaryColor: '#F0FDFA',
      dynamicVariablesInput: '{\n  "source": "convai-replica",\n  "build": "test-brand-alpha"\n}',
    },
  },
  {
    id: 'test-brand-sunset',
    label: 'Test Brand Sunset',
    description: 'Second test preset with different logos, colors, and copy.',
    settings: {
      variant: 'expanded',
      placement: 'bottom-right',
      conversationMode: 'chat-mode',
      dismissible: true,
      actionText: 'Chat with Sunset',
      expandText: 'Need Sunset help?',
      orbDebug: false,
      avatarImageUrl: '/brands/test-brand-sunset-avatar.svg',
      secondaryLogoUrl: '/brands/test-brand-sunset-logo.svg',
      secondaryLogoSize: 44,
      secondaryLogoOffsetX: 18,
      secondaryLogoOffsetY: 51,
      secondaryLogoRounded: true,
      secondaryLogoShadow: true,
      useOrbColors: true,
      avatarOrbColor1: '#C2410C',
      avatarOrbColor2: '#F97316',
      useWidgetThemeColors: true,
      widgetBaseColor: '#FFF7ED',
      widgetBasePrimaryColor: '#7C2D12',
      widgetBaseBorderColor: '#FDBA74',
      widgetBaseSubtleColor: '#C2410C',
      widgetAccentColor: '#EA580C',
      widgetAccentPrimaryColor: '#FFF7ED',
      dynamicVariablesInput: '{\n  "source": "convai-replica",\n  "build": "test-brand-sunset"\n}',
    },
  },
] as const;
