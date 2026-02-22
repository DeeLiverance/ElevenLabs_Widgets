'use client';

import * as React from 'react';

import {
  ConvAIWidgetEmbed,
  type ConvAIWidgetThemeColors,
  dispatchConvAIExpandAction,
} from '@/components/elevenlabs/convai-widget-embed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  convaiReplicaPresets,
  type ConvAIReplicaPresetSettings,
} from '@/lib/convai-replica-presets';

const variantOptions = ['tiny', 'compact', 'expanded', 'full'] as const;
type VariantOption = (typeof variantOptions)[number];
const placementOptions = [
  'top-left',
  'top',
  'top-right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const;
type PlacementOption = (typeof placementOptions)[number];
const conversationModeOptions = [
  { id: 'voice-and-text', label: 'Voice + text', description: 'Mic and text input are both available.' },
  { id: 'voice-only', label: 'Voice only', description: 'Hide text input and keep voice interaction only.' },
  { id: 'chat-mode', label: 'Chat mode', description: 'Force text-only mode for traditional chat behavior.' },
] as const;
type ConversationModeOption = (typeof conversationModeOptions)[number]['id'];

const colorPresets = [
  { id: 'violet', label: 'Violet', color1: '#6D28D9', color2: '#A855F7' },
  { id: 'ocean', label: 'Ocean', color1: '#0EA5E9', color2: '#06B6D4' },
  { id: 'sunset', label: 'Sunset', color1: '#F97316', color2: '#EF4444' },
  { id: 'forest', label: 'Forest', color1: '#16A34A', color2: '#14B8A6' },
] as const;

const widgetThemePresets = [
  {
    id: 'mono',
    label: 'Mono',
    base: '#FFFFFF',
    basePrimary: '#000000',
    baseBorder: '#E5E7EB',
    baseSubtle: '#6B7280',
    accent: '#111827',
    accentPrimary: '#FFFFFF',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    base: '#ECFEFF',
    basePrimary: '#083344',
    baseBorder: '#67E8F9',
    baseSubtle: '#0E7490',
    accent: '#0E7490',
    accentPrimary: '#ECFEFF',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    base: '#FFF7ED',
    basePrimary: '#7C2D12',
    baseBorder: '#FDBA74',
    baseSubtle: '#C2410C',
    accent: '#EA580C',
    accentPrimary: '#FFF7ED',
  },
  {
    id: 'forest',
    label: 'Forest',
    base: '#F0FDF4',
    basePrimary: '#14532D',
    baseBorder: '#86EFAC',
    baseSubtle: '#15803D',
    accent: '#15803D',
    accentPrimary: '#F0FDF4',
  },
] as const;

interface ConvAIReplicaClientProps {
  agentId?: string;
}

type EventLogItem = {
  id: number;
  text: string;
};

const PLAYGROUND_SETTINGS_STORAGE_KEY = 'convai-replica-playground-settings-v1';
const REPO_BRAND_PROFILES_API_PATH = '/api/brand-profiles';
const REPO_BRAND_PROFILES_EXPORT_TS_API_PATH = '/api/brand-profiles/export-ts';

type ConvAIReplicaSettings = ConvAIReplicaPresetSettings & {
  repoPresetId?: string;
};

type SavedBrandProfile = {
  id: string;
  label: string;
  description: string;
  settings: Partial<ConvAIReplicaPresetSettings>;
};

function sanitizePresetId(rawId: string): string {
  const normalized = rawId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'new-client';
}

function escapeSingleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function toProfileSettings(snapshot: ConvAIReplicaSettings): ConvAIReplicaPresetSettings {
  const { repoPresetId: _unusedRepoPresetId, ...settings } = snapshot;
  return settings;
}

function parseDynamicVariables(rawInput: string): { value?: Record<string, string>; error?: string } {
  if (!rawInput.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawInput);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'Dynamic variables must be a JSON object.' };
    }

    const value: Record<string, string> = {};
    for (const [key, fieldValue] of Object.entries(parsed)) {
      value[key] = String(fieldValue);
    }

    return { value };
  } catch {
    return { error: 'Dynamic variables JSON is invalid.' };
  }
}

export default function ConvAIReplicaClient({ agentId }: ConvAIReplicaClientProps) {
  const [agentIdInput, setAgentIdInput] = React.useState(agentId ?? '');
  const [variant, setVariant] = React.useState<VariantOption>('compact');
  const [placement, setPlacement] = React.useState<PlacementOption>('bottom-right');
  const [conversationMode, setConversationMode] =
    React.useState<ConversationModeOption>('voice-and-text');
  const [dismissible, setDismissible] = React.useState(true);
  const [actionText, setActionText] = React.useState('Talk to us');
  const [expandText, setExpandText] = React.useState('Need help?');
  const [orbDebug, setOrbDebug] = React.useState(false);
  const [avatarImageUrl, setAvatarImageUrl] = React.useState('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = React.useState('');
  const [secondaryLogoLoadError, setSecondaryLogoLoadError] = React.useState<string | null>(null);
  const [secondaryLogoSize, setSecondaryLogoSize] = React.useState(42);
  const [secondaryLogoOffsetX, setSecondaryLogoOffsetX] = React.useState(18);
  const [secondaryLogoOffsetY, setSecondaryLogoOffsetY] = React.useState(51);
  const [secondaryLogoRounded, setSecondaryLogoRounded] = React.useState(true);
  const [secondaryLogoShadow, setSecondaryLogoShadow] = React.useState(true);
  const [providerText, setProviderText] = React.useState('Provided by WingSpanAi.com.au');
  const [providerUrl, setProviderUrl] = React.useState('https://wingspanai.com.au');
  const [providerIconUrl, setProviderIconUrl] = React.useState('/wingspan-favicon.ico');
  const [providerIconSize, setProviderIconSize] = React.useState(12);
  const [providerOffsetY, setProviderOffsetY] = React.useState(6);
  const [poweredByTextOverride, setPoweredByTextOverride] = React.useState('Powered by GRABiT-Labs');
  const [useOrbColors, setUseOrbColors] = React.useState(true);
  const [avatarOrbColor1, setAvatarOrbColor1] = React.useState<string>(colorPresets[0].color1);
  const [avatarOrbColor2, setAvatarOrbColor2] = React.useState<string>(colorPresets[0].color2);
  const [useWidgetThemeColors, setUseWidgetThemeColors] = React.useState(true);
  const [widgetBaseColor, setWidgetBaseColor] = React.useState<string>(widgetThemePresets[0].base);
  const [widgetBasePrimaryColor, setWidgetBasePrimaryColor] = React.useState<string>(
    widgetThemePresets[0].basePrimary
  );
  const [widgetBaseBorderColor, setWidgetBaseBorderColor] = React.useState<string>(
    widgetThemePresets[0].baseBorder
  );
  const [widgetBaseSubtleColor, setWidgetBaseSubtleColor] = React.useState<string>(
    widgetThemePresets[0].baseSubtle
  );
  const [widgetAccentColor, setWidgetAccentColor] = React.useState<string>(widgetThemePresets[0].accent);
  const [widgetAccentPrimaryColor, setWidgetAccentPrimaryColor] = React.useState<string>(
    widgetThemePresets[0].accentPrimary
  );
  const [inputBoxShrinkPx, setInputBoxShrinkPx] = React.useState(6);
  const [inputTextLiftPx, setInputTextLiftPx] = React.useState(6);
  const [avatarLoadError, setAvatarLoadError] = React.useState<string | null>(null);
  const [dynamicVariablesInput, setDynamicVariablesInput] = React.useState(
    '{\n  "source": "convai-replica",\n  "build": "baseline"\n}'
  );
  const [eventLog, setEventLog] = React.useState<EventLogItem[]>([]);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
  const [hasHydratedSavedSettings, setHasHydratedSavedSettings] = React.useState(false);
  const [selectedRepoPresetId, setSelectedRepoPresetId] = React.useState(
    convaiReplicaPresets[0]?.id ?? ''
  );
  const [newPresetIdInput, setNewPresetIdInput] = React.useState('wingspanai');
  const [newPresetLabelInput, setNewPresetLabelInput] = React.useState('WingSpanAi');
  const [newPresetDescriptionInput, setNewPresetDescriptionInput] = React.useState(
    'WingSpanAi client preset.'
  );
  const [savedBrandProfiles, setSavedBrandProfiles] = React.useState<SavedBrandProfile[]>([]);
  const [selectedSavedBrandId, setSelectedSavedBrandId] = React.useState('');
  const [isRepoProfilesLoading, setIsRepoProfilesLoading] = React.useState(false);
  const eventLogIdRef = React.useRef(0);
  const saveStatusTimeoutRef = React.useRef<number | null>(null);

  const dynamicVariablesResult = React.useMemo(
    () => parseDynamicVariables(dynamicVariablesInput),
    [dynamicVariablesInput]
  );

  const activePresetId = React.useMemo(() => {
    const matchingPreset = colorPresets.find(
      (preset) =>
        preset.color1.toLowerCase() === avatarOrbColor1.toLowerCase() &&
        preset.color2.toLowerCase() === avatarOrbColor2.toLowerCase()
    );

    return matchingPreset?.id;
  }, [avatarOrbColor1, avatarOrbColor2]);

  const activeWidgetThemePresetId = React.useMemo(() => {
    const matchingPreset = widgetThemePresets.find(
      (preset) =>
        preset.base.toLowerCase() === widgetBaseColor.toLowerCase() &&
        preset.basePrimary.toLowerCase() === widgetBasePrimaryColor.toLowerCase() &&
        preset.baseBorder.toLowerCase() === widgetBaseBorderColor.toLowerCase() &&
        preset.baseSubtle.toLowerCase() === widgetBaseSubtleColor.toLowerCase() &&
        preset.accent.toLowerCase() === widgetAccentColor.toLowerCase() &&
        preset.accentPrimary.toLowerCase() === widgetAccentPrimaryColor.toLowerCase()
    );

    return matchingPreset?.id;
  }, [
    widgetAccentColor,
    widgetAccentPrimaryColor,
    widgetBaseBorderColor,
    widgetBaseColor,
    widgetBasePrimaryColor,
    widgetBaseSubtleColor,
  ]);

  const selectedRepoPreset = React.useMemo(
    () => convaiReplicaPresets.find((preset) => preset.id === selectedRepoPresetId),
    [selectedRepoPresetId]
  );
  const selectedSavedBrandProfile = React.useMemo(
    () => savedBrandProfiles.find((profile) => profile.id === selectedSavedBrandId),
    [savedBrandProfiles, selectedSavedBrandId]
  );

  const widgetThemeColors = React.useMemo<ConvAIWidgetThemeColors | undefined>(() => {
    if (!useWidgetThemeColors) {
      return undefined;
    }

    return {
      base: widgetBaseColor,
      basePrimary: widgetBasePrimaryColor,
      baseBorder: widgetBaseBorderColor,
      baseSubtle: widgetBaseSubtleColor,
      accent: widgetAccentColor,
      accentPrimary: widgetAccentPrimaryColor,
    };
  }, [
    useWidgetThemeColors,
    widgetAccentColor,
    widgetAccentPrimaryColor,
    widgetBaseBorderColor,
    widgetBaseColor,
    widgetBasePrimaryColor,
    widgetBaseSubtleColor,
  ]);

  const resolvedAgentId = agentIdInput.trim();
  const activeConversationMode = React.useMemo(
    () => conversationModeOptions.find((option) => option.id === conversationMode),
    [conversationMode]
  );

  const applySavedSettings = React.useCallback(
    (saved: Partial<ConvAIReplicaSettings>) => {
      if (
        typeof saved.repoPresetId === 'string' &&
        convaiReplicaPresets.some((preset) => preset.id === saved.repoPresetId)
      ) {
        setSelectedRepoPresetId(saved.repoPresetId);
      }
      if (typeof saved.agentId === 'string') setAgentIdInput(saved.agentId);
      if (saved.variant && variantOptions.includes(saved.variant as VariantOption)) {
        setVariant(saved.variant as VariantOption);
      }
      if (saved.placement && placementOptions.includes(saved.placement as PlacementOption)) {
        setPlacement(saved.placement as PlacementOption);
      }
      if (
        saved.conversationMode &&
        conversationModeOptions.some((option) => option.id === saved.conversationMode)
      ) {
        setConversationMode(saved.conversationMode as ConversationModeOption);
      }
      if (typeof saved.dismissible === 'boolean') setDismissible(saved.dismissible);
      if (typeof saved.actionText === 'string') setActionText(saved.actionText);
      if (typeof saved.expandText === 'string') setExpandText(saved.expandText);
      if (typeof saved.orbDebug === 'boolean') setOrbDebug(saved.orbDebug);
      if (typeof saved.avatarImageUrl === 'string') setAvatarImageUrl(saved.avatarImageUrl);
      if (typeof saved.secondaryLogoUrl === 'string') setSecondaryLogoUrl(saved.secondaryLogoUrl);
      if (typeof saved.secondaryLogoSize === 'number') {
        setSecondaryLogoSize(Math.min(120, Math.max(20, Math.round(saved.secondaryLogoSize))));
      }
      if (typeof saved.secondaryLogoOffsetX === 'number') {
        setSecondaryLogoOffsetX(Math.min(240, Math.max(0, Math.round(saved.secondaryLogoOffsetX))));
      }
      if (typeof saved.secondaryLogoOffsetY === 'number') {
        setSecondaryLogoOffsetY(Math.min(240, Math.max(0, Math.round(saved.secondaryLogoOffsetY))));
      }
      if (typeof saved.secondaryLogoRounded === 'boolean') setSecondaryLogoRounded(saved.secondaryLogoRounded);
      if (typeof saved.secondaryLogoShadow === 'boolean') setSecondaryLogoShadow(saved.secondaryLogoShadow);
      if (typeof saved.providerText === 'string') setProviderText(saved.providerText);
      if (typeof saved.providerUrl === 'string') setProviderUrl(saved.providerUrl);
      if (typeof saved.providerIconUrl === 'string') setProviderIconUrl(saved.providerIconUrl);
      if (typeof saved.providerIconSize === 'number') {
        setProviderIconSize(Math.min(64, Math.max(0, Math.round(saved.providerIconSize))));
      }
      if (typeof saved.providerOffsetY === 'number') {
        setProviderOffsetY(Math.min(80, Math.max(-40, Math.round(saved.providerOffsetY))));
      }
      if (typeof saved.poweredByTextOverride === 'string') {
        setPoweredByTextOverride(saved.poweredByTextOverride);
      }
      if (typeof saved.useOrbColors === 'boolean') setUseOrbColors(saved.useOrbColors);
      if (typeof saved.avatarOrbColor1 === 'string') setAvatarOrbColor1(saved.avatarOrbColor1);
      if (typeof saved.avatarOrbColor2 === 'string') setAvatarOrbColor2(saved.avatarOrbColor2);
      if (typeof saved.useWidgetThemeColors === 'boolean') setUseWidgetThemeColors(saved.useWidgetThemeColors);
      if (typeof saved.widgetBaseColor === 'string') setWidgetBaseColor(saved.widgetBaseColor);
      if (typeof saved.widgetBasePrimaryColor === 'string') {
        setWidgetBasePrimaryColor(saved.widgetBasePrimaryColor);
      }
      if (typeof saved.widgetBaseBorderColor === 'string') setWidgetBaseBorderColor(saved.widgetBaseBorderColor);
      if (typeof saved.widgetBaseSubtleColor === 'string') setWidgetBaseSubtleColor(saved.widgetBaseSubtleColor);
      if (typeof saved.widgetAccentColor === 'string') setWidgetAccentColor(saved.widgetAccentColor);
      if (typeof saved.widgetAccentPrimaryColor === 'string') {
        setWidgetAccentPrimaryColor(saved.widgetAccentPrimaryColor);
      }
      if (typeof saved.inputBoxShrinkPx === 'number') {
        setInputBoxShrinkPx(Math.min(40, Math.max(0, Math.round(saved.inputBoxShrinkPx))));
      }
      if (typeof saved.inputTextLiftPx === 'number') {
        setInputTextLiftPx(Math.min(40, Math.max(0, Math.round(saved.inputTextLiftPx))));
      }
      if (typeof saved.dynamicVariablesInput === 'string') {
        setDynamicVariablesInput(saved.dynamicVariablesInput);
      }
      setAvatarLoadError(null);
      setSecondaryLogoLoadError(null);
    },
    []
  );

  const settingsSnapshot = React.useMemo<ConvAIReplicaSettings>(
    () => ({
      repoPresetId: selectedRepoPresetId,
      agentId: resolvedAgentId,
      variant,
      placement,
      conversationMode,
      dismissible,
      actionText,
      expandText,
      orbDebug,
      avatarImageUrl,
      secondaryLogoUrl,
      secondaryLogoSize,
      secondaryLogoOffsetX,
      secondaryLogoOffsetY,
      secondaryLogoRounded,
      secondaryLogoShadow,
      providerText,
      providerUrl,
      providerIconUrl,
      providerIconSize,
      providerOffsetY,
      poweredByTextOverride,
      useOrbColors,
      avatarOrbColor1,
      avatarOrbColor2,
      useWidgetThemeColors,
      widgetBaseColor,
      widgetBasePrimaryColor,
      widgetBaseBorderColor,
      widgetBaseSubtleColor,
      widgetAccentColor,
      widgetAccentPrimaryColor,
      inputBoxShrinkPx,
      inputTextLiftPx,
      dynamicVariablesInput,
    }),
    [
      selectedRepoPresetId,
      resolvedAgentId,
      variant,
      placement,
      conversationMode,
      dismissible,
      actionText,
      expandText,
      orbDebug,
      avatarImageUrl,
      secondaryLogoUrl,
      secondaryLogoSize,
      secondaryLogoOffsetX,
      secondaryLogoOffsetY,
      secondaryLogoRounded,
      secondaryLogoShadow,
      providerText,
      providerUrl,
      providerIconUrl,
      providerIconSize,
      providerOffsetY,
      poweredByTextOverride,
      useOrbColors,
      avatarOrbColor1,
      avatarOrbColor2,
      useWidgetThemeColors,
      widgetBaseColor,
      widgetBasePrimaryColor,
      widgetBaseBorderColor,
      widgetBaseSubtleColor,
      widgetAccentColor,
      widgetAccentPrimaryColor,
      inputBoxShrinkPx,
      inputTextLiftPx,
      dynamicVariablesInput,
    ]
  );

  const setTemporaryStatus = React.useCallback((message: string) => {
    setSaveStatus(message);
    if (saveStatusTimeoutRef.current !== null) {
      window.clearTimeout(saveStatusTimeoutRef.current);
    }
    saveStatusTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus(null);
      saveStatusTimeoutRef.current = null;
    }, 2600);
  }, []);

  const handleApplyRepoPreset = React.useCallback(() => {
    if (!selectedRepoPresetId) {
      setTemporaryStatus('Pick a preset first.');
      return;
    }

    const preset = convaiReplicaPresets.find((item) => item.id === selectedRepoPresetId);
    if (!preset) {
      setTemporaryStatus('Preset not found in repo.');
      return;
    }

    applySavedSettings(preset.settings);
    setTemporaryStatus(`Repo preset loaded: ${preset.label}.`);
  }, [applySavedSettings, selectedRepoPresetId, setTemporaryStatus]);

  const handleCopySettingsJson = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await window.navigator.clipboard.writeText(JSON.stringify(settingsSnapshot, null, 2));
      setTemporaryStatus('Settings JSON copied. Add it to a file in brand-profiles/.');
    } catch {
      setTemporaryStatus('Could not copy settings JSON.');
    }
  }, [settingsSnapshot, setTemporaryStatus]);

  const handleCopyPresetTemplate = React.useCallback(async () => {
    if (typeof window === 'undefined') return;

    const presetId = sanitizePresetId(newPresetIdInput);
    const presetLabel = newPresetLabelInput.trim() || 'New Client';
    const presetDescription = newPresetDescriptionInput.trim() || `${presetLabel} preset.`;
    const presetSettings = toProfileSettings(settingsSnapshot);

    const presetBlock = [
      '{',
      `  id: '${escapeSingleQuoted(presetId)}',`,
      `  label: '${escapeSingleQuoted(presetLabel)}',`,
      `  description: '${escapeSingleQuoted(presetDescription)}',`,
      `  settings: ${JSON.stringify(presetSettings, null, 2)},`,
      '},',
    ].join('\n');

    try {
      await window.navigator.clipboard.writeText(presetBlock);
      setNewPresetIdInput(presetId);
      setTemporaryStatus(
        `Preset block copied for ${presetLabel}. Paste into a file in brand-profiles/.`
      );
    } catch {
      setTemporaryStatus('Could not copy preset block.');
    }
  }, [
    newPresetDescriptionInput,
    newPresetIdInput,
    newPresetLabelInput,
    settingsSnapshot,
    setTemporaryStatus,
  ]);

  const refreshRepoBrandProfiles = React.useCallback(
    async (options?: { preferredId?: string; seedIfEmpty?: boolean; silent?: boolean }) => {
      setIsRepoProfilesLoading(true);
      try {
        const response = await fetch(REPO_BRAND_PROFILES_API_PATH, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Could not load repo brand profiles.');
        }

        const payload = (await response.json()) as { profiles?: SavedBrandProfile[] };
        let profiles = Array.isArray(payload.profiles) ? payload.profiles : [];

        if (profiles.length === 0 && options?.seedIfEmpty) {
          const seedProfiles = convaiReplicaPresets
            .filter((preset) => preset.id.startsWith('test-brand-'))
            .map((preset) => ({
              id: preset.id,
              label: preset.label,
              description: preset.description,
              settings: preset.settings,
            }));

          for (const profile of seedProfiles) {
            await fetch(REPO_BRAND_PROFILES_API_PATH, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profile),
            });
          }

          const seededResponse = await fetch(REPO_BRAND_PROFILES_API_PATH, {
            method: 'GET',
            cache: 'no-store',
          });
          if (seededResponse.ok) {
            const seededPayload = (await seededResponse.json()) as { profiles?: SavedBrandProfile[] };
            profiles = Array.isArray(seededPayload.profiles) ? seededPayload.profiles : profiles;
          }
        }

        setSavedBrandProfiles(profiles);
        setSelectedSavedBrandId((current) => {
          if (options?.preferredId && profiles.some((profile) => profile.id === options.preferredId)) {
            return options.preferredId;
          }
          if (current && profiles.some((profile) => profile.id === current)) {
            return current;
          }
          return profiles[0]?.id ?? '';
        });

        return profiles;
      } catch {
        if (!options?.silent) {
          setTemporaryStatus('Could not load repo brand profiles.');
        }
        return [];
      } finally {
        setIsRepoProfilesLoading(false);
      }
    },
    [setTemporaryStatus]
  );

  const handleSaveBrandProfile = React.useCallback(async () => {
    const id = sanitizePresetId(newPresetIdInput);
    const label = newPresetLabelInput.trim() || 'New Client';
    const description = newPresetDescriptionInput.trim() || `${label} preset.`;
    const profile: SavedBrandProfile = {
      id,
      label,
      description,
      settings: toProfileSettings(settingsSnapshot),
    };

    try {
      const response = await fetch(REPO_BRAND_PROFILES_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error();
      }

      setNewPresetIdInput(id);
      await refreshRepoBrandProfiles({ preferredId: id, silent: true });
      setTemporaryStatus(`Brand profile saved to repo: ${label} (logos included).`);
    } catch {
      setTemporaryStatus('Could not save brand profile to repo.');
    }
  }, [
    newPresetDescriptionInput,
    newPresetIdInput,
    newPresetLabelInput,
    refreshRepoBrandProfiles,
    settingsSnapshot,
    setTemporaryStatus,
  ]);

  const handleSaveTsPreset = React.useCallback(async () => {
    const id = sanitizePresetId(newPresetIdInput);
    const label = newPresetLabelInput.trim() || 'New Client';
    const description = newPresetDescriptionInput.trim() || `${label} preset.`;
    const profile: SavedBrandProfile = {
      id,
      label,
      description,
      settings: toProfileSettings(settingsSnapshot),
    };

    try {
      const response = await fetch(REPO_BRAND_PROFILES_EXPORT_TS_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error();
      }

      setNewPresetIdInput(id);
      setTemporaryStatus(`TS preset saved: brand-profiles/generated/${id}.ts`);
    } catch {
      setTemporaryStatus('Could not save TS preset.');
    }
  }, [
    newPresetDescriptionInput,
    newPresetIdInput,
    newPresetLabelInput,
    settingsSnapshot,
    setTemporaryStatus,
  ]);

  const handleLoadBrandProfile = React.useCallback(() => {
    if (!selectedSavedBrandProfile) {
      setTemporaryStatus('Pick a saved brand profile first.');
      return;
    }

    applySavedSettings(selectedSavedBrandProfile.settings);
    setNewPresetIdInput(selectedSavedBrandProfile.id);
    setNewPresetLabelInput(selectedSavedBrandProfile.label);
    setNewPresetDescriptionInput(selectedSavedBrandProfile.description);
    setTemporaryStatus(`Brand profile loaded: ${selectedSavedBrandProfile.label}.`);
  }, [applySavedSettings, selectedSavedBrandProfile, setTemporaryStatus]);

  const handleDeleteBrandProfile = React.useCallback(async () => {
    if (!selectedSavedBrandId) {
      setTemporaryStatus('Pick a saved brand profile first.');
      return;
    }
    try {
      const removedProfile = savedBrandProfiles.find((profile) => profile.id === selectedSavedBrandId);
      const response = await fetch(
        `${REPO_BRAND_PROFILES_API_PATH}/${encodeURIComponent(selectedSavedBrandId)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error();
      }
      await refreshRepoBrandProfiles({ silent: true });
      setTemporaryStatus(removedProfile ? `Brand profile removed: ${removedProfile.label}.` : 'Brand profile removed.');
    } catch {
      setTemporaryStatus('Could not delete brand profile.');
    }
  }, [refreshRepoBrandProfiles, savedBrandProfiles, selectedSavedBrandId, setTemporaryStatus]);

  const handleSaveSettings = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        PLAYGROUND_SETTINGS_STORAGE_KEY,
        JSON.stringify(settingsSnapshot)
      );
      setTemporaryStatus('Settings saved to this browser.');
    } catch {
      setTemporaryStatus('Could not save settings (local storage unavailable).');
    }
  }, [settingsSnapshot, setTemporaryStatus]);

  const handleLoadSettings = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(PLAYGROUND_SETTINGS_STORAGE_KEY);
    if (!raw) {
      setTemporaryStatus('No saved settings found yet.');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ConvAIReplicaSettings>;
      applySavedSettings(parsed);
      setTemporaryStatus('Saved settings loaded.');
    } catch {
      setTemporaryStatus('Saved settings are invalid JSON.');
    }
  }, [applySavedSettings, setTemporaryStatus]);

  const handleClearSavedSettings = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PLAYGROUND_SETTINGS_STORAGE_KEY);
    setTemporaryStatus('Saved settings were cleared.');
  }, [setTemporaryStatus]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(PLAYGROUND_SETTINGS_STORAGE_KEY);
    if (!raw) {
      setHasHydratedSavedSettings(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ConvAIReplicaSettings>;
      applySavedSettings(parsed);
    } catch {
      // Ignore malformed stored payloads and keep current defaults.
    } finally {
      setHasHydratedSavedSettings(true);
    }
  }, [applySavedSettings]);

  React.useEffect(() => {
    void refreshRepoBrandProfiles({ seedIfEmpty: true, silent: true });
  }, [refreshRepoBrandProfiles]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasHydratedSavedSettings) return;

    try {
      window.localStorage.setItem(
        PLAYGROUND_SETTINGS_STORAGE_KEY,
        JSON.stringify(settingsSnapshot)
      );
    } catch {
      setTemporaryStatus('Could not auto-save settings (local storage unavailable).');
    }
  }, [hasHydratedSavedSettings, settingsSnapshot, setTemporaryStatus]);

  React.useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current !== null) {
        window.clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  const handleCallEvent = React.useCallback((event: Event) => {
    const time = new Date().toLocaleTimeString();
    const details =
      event instanceof CustomEvent && event.detail ? ` ${JSON.stringify(event.detail)}` : '';
    const message = `${time} received elevenlabs-convai:call${details}`;
    const nextId = ++eventLogIdRef.current;

    setEventLog((currentLog) => [{ id: nextId, text: message }, ...currentLog].slice(0, 8));
  }, []);

  const handleAvatarFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setAvatarLoadError('Please choose an image file.');
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          setAvatarLoadError('Could not read image file.');
          return;
        }

        setAvatarImageUrl(reader.result);
        setAvatarLoadError(null);
      };

      reader.onerror = () => {
        setAvatarLoadError('Could not read image file.');
      };

      reader.readAsDataURL(file);
      event.currentTarget.value = '';
    },
    []
  );

  const handleSecondaryLogoFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setSecondaryLogoLoadError('Please choose an image file.');
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          setSecondaryLogoLoadError('Could not read image file.');
          return;
        }

        setSecondaryLogoUrl(reader.result);
        setSecondaryLogoLoadError(null);
      };

      reader.onerror = () => {
        setSecondaryLogoLoadError('Could not read image file.');
      };

      reader.readAsDataURL(file);
      event.currentTarget.value = '';
    },
    []
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ConvAI Widget Replica</h1>
        <p className="text-muted-foreground">
          Baseline replica route using the official embed contract with runtime host controls.
        </p>
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="repo-preset">Repo preset</Label>
            <Select value={selectedRepoPresetId} onValueChange={setSelectedRepoPresetId}>
              <SelectTrigger id="repo-preset" className="w-full">
                <SelectValue placeholder="Choose a repo preset" />
              </SelectTrigger>
              <SelectContent>
                {convaiReplicaPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {selectedRepoPreset?.description ??
                'Choose a source-controlled preset from brand-profiles/.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleApplyRepoPreset}>
              Apply preset
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleCopySettingsJson()}>
              Copy settings JSON
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="new-preset-id">New preset ID</Label>
            <Input
              id="new-preset-id"
              value={newPresetIdInput}
              onChange={(event) => setNewPresetIdInput(event.target.value)}
              placeholder="wingspanai"
            />
            <p className="text-muted-foreground text-xs">
              Saved ID: <code>{sanitizePresetId(newPresetIdInput)}</code>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-preset-label">New preset label</Label>
            <Input
              id="new-preset-label"
              value={newPresetLabelInput}
              onChange={(event) => setNewPresetLabelInput(event.target.value)}
              placeholder="WingSpanAi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-preset-description">New preset description</Label>
            <Input
              id="new-preset-description"
              value={newPresetDescriptionInput}
              onChange={(event) => setNewPresetDescriptionInput(event.target.value)}
              placeholder="WingSpanAi client preset."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => void handleCopyPresetTemplate()}>
            Copy preset block
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="saved-brand-profiles">Repo brand profiles (logos included)</Label>
            <Select value={selectedSavedBrandId} onValueChange={setSelectedSavedBrandId}>
              <SelectTrigger id="saved-brand-profiles" className="w-full">
                <SelectValue
                  placeholder={isRepoProfilesLoading ? 'Loading repo profiles...' : 'No repo profiles yet'}
                />
              </SelectTrigger>
              <SelectContent>
                {savedBrandProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Saves to `brand-profiles/repo-json` so profiles are portable across workstations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void handleSaveBrandProfile()}>
              Save brand profile
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleSaveTsPreset()}>
              Save TS preset
            </Button>
            <Button type="button" variant="secondary" onClick={handleLoadBrandProfile}>
              Load brand profile
            </Button>
            <Button type="button" variant="ghost" onClick={() => void handleDeleteBrandProfile()}>
              Delete brand profile
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void refreshRepoBrandProfiles({ silent: true })}
            >
              Refresh repo list
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="agent-id-input">ElevenLabs agent ID</Label>
            <Input
              id="agent-id-input"
              value={agentIdInput}
              onChange={(event) => setAgentIdInput(event.target.value)}
              placeholder="agent_..."
            />
            <p className="text-muted-foreground text-xs">
              Attach this widget instance to a specific ElevenLabs Conversational AI agent.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleSaveSettings}>
              Save draft (browser)
            </Button>
            <Button type="button" variant="secondary" onClick={handleLoadSettings}>
              Load draft
            </Button>
            <Button type="button" variant="ghost" onClick={handleClearSavedSettings}>
              Clear draft
            </Button>
          </div>
        </div>
        {saveStatus ? <p className="text-muted-foreground text-xs">{saveStatus}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="variant">Variant</Label>
            <Select value={variant} onValueChange={(value) => setVariant(value as VariantOption)}>
              <SelectTrigger id="variant" className="w-full">
                <SelectValue placeholder="Select a variant" />
              </SelectTrigger>
              <SelectContent>
                {variantOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placement">Placement</Label>
            <Select
              value={placement}
              onValueChange={(value) => setPlacement(value as PlacementOption)}
            >
              <SelectTrigger id="placement" className="w-full">
                <SelectValue placeholder="Select placement" />
              </SelectTrigger>
              <SelectContent>
                {placementOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Conversation mode</Label>
            <div className="flex flex-wrap gap-2">
              {conversationModeOptions.map((option) => {
                const isActive = conversationMode === option.id;
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={isActive ? 'default' : 'secondary'}
                    onClick={() => setConversationMode(option.id)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-xs">
              {activeConversationMode?.description}
            </p>
          </div>

          <div className="flex items-end justify-between rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="dismissible">Dismissible</Label>
              <p className="text-muted-foreground text-xs">Allow close/hide interactions.</p>
            </div>
            <Switch
              id="dismissible"
              checked={dismissible}
              onCheckedChange={(checked) => setDismissible(Boolean(checked))}
            />
          </div>

          <div className="flex items-end justify-between rounded-md border p-3 md:col-span-2">
            <div className="space-y-1">
              <Label htmlFor="orb-debug">Orb debug mode</Label>
              <p className="text-muted-foreground text-xs">
                Highlights detected orb bounds and logs position changes to browser console.
              </p>
            </div>
            <Switch
              id="orb-debug"
              checked={orbDebug}
              onCheckedChange={(checked) => setOrbDebug(Boolean(checked))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-text">Action text</Label>
            <Input
              id="action-text"
              value={actionText}
              onChange={(event) => setActionText(event.target.value)}
              placeholder="Talk to us"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expand-text">Expand text</Label>
            <Input
              id="expand-text"
              value={expandText}
              onChange={(event) => setExpandText(event.target.value)}
              placeholder="Need help?"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="avatar-image-url">Avatar image URL (optional)</Label>
            <Input
              id="avatar-image-url"
              value={avatarImageUrl}
              onChange={(event) => {
                setAvatarImageUrl(event.target.value);
                setAvatarLoadError(null);
              }}
              placeholder="https://example.com/avatar.png"
            />
            <p className="text-muted-foreground text-xs">
              Use a direct image URL, or upload a local image below.
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="avatar-upload">Upload avatar image</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="max-w-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAvatarImageUrl('');
                  setAvatarLoadError(null);
                }}
              >
                Clear avatar
              </Button>
            </div>
            {avatarLoadError ? <p className="text-destructive text-xs">{avatarLoadError}</p> : null}
            {avatarImageUrl ? (
              <div className="inline-flex items-center gap-3 rounded-md border p-2">
                <div
                  role="img"
                  aria-label="Avatar preview"
                  className="h-14 w-14 rounded-full border bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${avatarImageUrl}")` }}
                />
                <span className="text-muted-foreground text-xs">Avatar preview</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="secondary-logo-url">Company logo URL (header overlay)</Label>
            <Input
              id="secondary-logo-url"
              value={secondaryLogoUrl}
              onChange={(event) => {
                setSecondaryLogoUrl(event.target.value);
                setSecondaryLogoLoadError(null);
              }}
              placeholder="https://example.com/company-logo.png"
            />
            <p className="text-muted-foreground text-xs">
              This is a second logo in the top-left of the expanded widget panel.
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="secondary-logo-upload">Upload company logo</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="secondary-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleSecondaryLogoFileChange}
                className="max-w-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSecondaryLogoUrl('');
                  setSecondaryLogoLoadError(null);
                }}
              >
                Clear logo
              </Button>
            </div>
            {secondaryLogoLoadError ? (
              <p className="text-destructive text-xs">{secondaryLogoLoadError}</p>
            ) : null}
            {secondaryLogoUrl ? (
              <div className="inline-flex items-center gap-3 rounded-md border p-2">
                <div
                  role="img"
                  aria-label="Company logo preview"
                  className="h-14 w-14 rounded-md border bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${secondaryLogoUrl}")` }}
                />
                <span className="text-muted-foreground text-xs">Company logo preview</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-logo-size">Company logo size</Label>
            <Input
              id="secondary-logo-size"
              type="number"
              min={20}
              max={120}
              value={secondaryLogoSize}
              onChange={(event) =>
                setSecondaryLogoSize(
                  Math.min(120, Math.max(20, Number(event.target.value) || secondaryLogoSize))
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-logo-offset-x">Company logo offset X</Label>
            <Input
              id="secondary-logo-offset-x"
              type="number"
              min={0}
              max={240}
              value={secondaryLogoOffsetX}
              onChange={(event) =>
                setSecondaryLogoOffsetX(
                  Math.min(240, Math.max(0, Number(event.target.value) || secondaryLogoOffsetX))
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-logo-offset-y">Company logo offset Y</Label>
            <Input
              id="secondary-logo-offset-y"
              type="number"
              min={0}
              max={240}
              value={secondaryLogoOffsetY}
              onChange={(event) =>
                setSecondaryLogoOffsetY(
                  Math.min(240, Math.max(0, Number(event.target.value) || secondaryLogoOffsetY))
                )
              }
            />
          </div>

          <div className="flex items-end justify-between rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="secondary-logo-rounded">Rounded company logo</Label>
              <p className="text-muted-foreground text-xs">Render company logo as a circle.</p>
            </div>
            <Switch
              id="secondary-logo-rounded"
              checked={secondaryLogoRounded}
              onCheckedChange={(checked) => setSecondaryLogoRounded(Boolean(checked))}
            />
          </div>

          <div className="flex items-end justify-between rounded-md border p-3 md:col-span-2">
            <div className="space-y-1">
              <Label htmlFor="secondary-logo-shadow">Company logo shadow</Label>
              <p className="text-muted-foreground text-xs">
                Add shadow for readability on light backgrounds.
              </p>
            </div>
            <Switch
              id="secondary-logo-shadow"
              checked={secondaryLogoShadow}
              onCheckedChange={(checked) => setSecondaryLogoShadow(Boolean(checked))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="provider-text">Provider footer text</Label>
            <Input
              id="provider-text"
              value={providerText}
              onChange={(event) => setProviderText(event.target.value)}
              placeholder="Provided by WingSpanAi.com.au"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-url">Provider footer URL</Label>
            <Input
              id="provider-url"
              value={providerUrl}
              onChange={(event) => setProviderUrl(event.target.value)}
              placeholder="https://wingspanai.com.au"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-icon-url">Provider icon URL</Label>
            <Input
              id="provider-icon-url"
              value={providerIconUrl}
              onChange={(event) => setProviderIconUrl(event.target.value)}
              placeholder="/wingspan-favicon.ico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-icon-size">Provider icon size</Label>
            <Input
              id="provider-icon-size"
              type="number"
              min={0}
              max={64}
              value={providerIconSize}
              onChange={(event) =>
                setProviderIconSize(Math.min(64, Math.max(0, Number(event.target.value) || providerIconSize)))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-offset-y">Provider offset Y</Label>
            <Input
              id="provider-offset-y"
              type="number"
              min={-40}
              max={80}
              value={providerOffsetY}
              onChange={(event) =>
                setProviderOffsetY(Math.min(80, Math.max(-40, Number(event.target.value) || providerOffsetY)))
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="powered-by-text-override">Powered-by text override</Label>
            <Input
              id="powered-by-text-override"
              value={poweredByTextOverride}
              onChange={(event) => setPoweredByTextOverride(event.target.value)}
              placeholder="Powered by GRABiT-Labs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input-box-shrink-px">Input box shrink (px)</Label>
            <Input
              id="input-box-shrink-px"
              type="number"
              min={0}
              max={40}
              value={inputBoxShrinkPx}
              onChange={(event) =>
                setInputBoxShrinkPx(Math.min(40, Math.max(0, Number(event.target.value) || inputBoxShrinkPx)))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input-text-lift-px">Input text lift (px)</Label>
            <Input
              id="input-text-lift-px"
              type="number"
              min={0}
              max={40}
              value={inputTextLiftPx}
              onChange={(event) =>
                setInputTextLiftPx(Math.min(40, Math.max(0, Number(event.target.value) || inputTextLiftPx)))
              }
            />
          </div>

          <div className="flex items-end justify-between rounded-md border p-3 md:col-span-2">
            <div className="space-y-1">
              <Label htmlFor="use-orb-colors">Use orb colors</Label>
              <p className="text-muted-foreground text-xs">
                Apply gradient colors to the widget orb.
              </p>
            </div>
            <Switch
              id="use-orb-colors"
              checked={useOrbColors}
              onCheckedChange={(checked) => setUseOrbColors(Boolean(checked))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Color presets</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => {
                const isActive = activePresetId === preset.id;

                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isActive ? 'default' : 'secondary'}
                    onClick={() => {
                      setAvatarOrbColor1(preset.color1);
                      setAvatarOrbColor2(preset.color2);
                    }}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-end justify-between rounded-md border p-3 md:col-span-2">
            <div className="space-y-1">
              <Label htmlFor="use-widget-theme-colors">Use full widget colors</Label>
              <p className="text-muted-foreground text-xs">
                Apply panel, text, and button color variables for the full widget.
              </p>
            </div>
            <Switch
              id="use-widget-theme-colors"
              checked={useWidgetThemeColors}
              onCheckedChange={(checked) => setUseWidgetThemeColors(Boolean(checked))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Widget theme presets</Label>
            <div className="flex flex-wrap gap-2">
              {widgetThemePresets.map((preset) => {
                const isActive = activeWidgetThemePresetId === preset.id;

                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isActive ? 'default' : 'secondary'}
                    onClick={() => {
                      setWidgetBaseColor(preset.base);
                      setWidgetBasePrimaryColor(preset.basePrimary);
                      setWidgetBaseBorderColor(preset.baseBorder);
                      setWidgetBaseSubtleColor(preset.baseSubtle);
                      setWidgetAccentColor(preset.accent);
                      setWidgetAccentPrimaryColor(preset.accentPrimary);
                    }}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-orb-color-1">Orb color 1</Label>
            <div className="flex gap-2">
              <Input
                id="avatar-orb-color-1"
                type="color"
                value={avatarOrbColor1}
                onChange={(event) => setAvatarOrbColor1(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={avatarOrbColor1}
                onChange={(event) => setAvatarOrbColor1(event.target.value)}
                placeholder="#6D28D9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-orb-color-2">Orb color 2</Label>
            <div className="flex gap-2">
              <Input
                id="avatar-orb-color-2"
                type="color"
                value={avatarOrbColor2}
                onChange={(event) => setAvatarOrbColor2(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={avatarOrbColor2}
                onChange={(event) => setAvatarOrbColor2(event.target.value)}
                placeholder="#A855F7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-base-color">Widget base</Label>
            <div className="flex gap-2">
              <Input
                id="widget-base-color"
                type="color"
                value={widgetBaseColor}
                onChange={(event) => setWidgetBaseColor(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={widgetBaseColor}
                onChange={(event) => setWidgetBaseColor(event.target.value)}
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-base-primary-color">Widget text</Label>
            <div className="flex gap-2">
              <Input
                id="widget-base-primary-color"
                type="color"
                value={widgetBasePrimaryColor}
                onChange={(event) => setWidgetBasePrimaryColor(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={widgetBasePrimaryColor}
                onChange={(event) => setWidgetBasePrimaryColor(event.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-base-border-color">Widget border</Label>
            <div className="flex gap-2">
              <Input
                id="widget-base-border-color"
                type="color"
                value={widgetBaseBorderColor}
                onChange={(event) => setWidgetBaseBorderColor(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={widgetBaseBorderColor}
                onChange={(event) => setWidgetBaseBorderColor(event.target.value)}
                placeholder="#E5E7EB"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-base-subtle-color">Helper text / placeholder</Label>
            <div className="flex gap-2">
              <Input
                id="widget-base-subtle-color"
                type="color"
                value={widgetBaseSubtleColor}
                onChange={(event) => setWidgetBaseSubtleColor(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={widgetBaseSubtleColor}
                onChange={(event) => setWidgetBaseSubtleColor(event.target.value)}
                placeholder="#6B7280"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-accent-color">Widget accent</Label>
            <div className="flex gap-2">
              <Input
                id="widget-accent-color"
                type="color"
                value={widgetAccentColor}
                onChange={(event) => setWidgetAccentColor(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={widgetAccentColor}
                onChange={(event) => setWidgetAccentColor(event.target.value)}
                placeholder="#111827"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="widget-accent-primary-color">Widget accent text</Label>
            <div className="flex gap-2">
              <Input
                id="widget-accent-primary-color"
                type="color"
                value={widgetAccentPrimaryColor}
                onChange={(event) => setWidgetAccentPrimaryColor(event.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                value={widgetAccentPrimaryColor}
                onChange={(event) => setWidgetAccentPrimaryColor(event.target.value)}
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dynamic-variables">Dynamic variables (JSON object)</Label>
          <Textarea
            id="dynamic-variables"
            value={dynamicVariablesInput}
            onChange={(event) => setDynamicVariablesInput(event.target.value)}
            className="min-h-24 font-mono text-sm"
            spellCheck={false}
          />
          {dynamicVariablesResult.error ? (
            <p className="text-destructive text-xs">{dynamicVariablesResult.error}</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Values are stringified before being sent to the widget.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => dispatchConvAIExpandAction('expand')}>
            Expand
          </Button>
          <Button type="button" variant="secondary" onClick={() => dispatchConvAIExpandAction('collapse')}>
            Collapse
          </Button>
          <Button type="button" variant="secondary" onClick={() => dispatchConvAIExpandAction('toggle')}>
            Toggle
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        {resolvedAgentId ? (
          <ConvAIWidgetEmbed
            agentId={resolvedAgentId}
            variant={variant}
            placement={placement}
            conversationMode={conversationMode}
            dismissible={dismissible}
            actionText={actionText}
            expandText={expandText}
            avatarImageUrl={avatarImageUrl || undefined}
            avatarOrbColor1={useOrbColors ? avatarOrbColor1 : undefined}
            avatarOrbColor2={useOrbColors ? avatarOrbColor2 : undefined}
            themeColors={widgetThemeColors}
            secondaryLogoUrl={secondaryLogoUrl || undefined}
            secondaryLogoSize={secondaryLogoSize}
            secondaryLogoOffsetX={secondaryLogoOffsetX}
            secondaryLogoOffsetY={secondaryLogoOffsetY}
            secondaryLogoRounded={secondaryLogoRounded}
            secondaryLogoShadow={secondaryLogoShadow}
            providerText={providerText || undefined}
            providerUrl={providerUrl || undefined}
            providerIconUrl={providerIconUrl || undefined}
            providerIconSize={providerIconSize}
            providerOffsetY={providerOffsetY}
            poweredByTextOverride={poweredByTextOverride || undefined}
            orbDebug={orbDebug}
            inputBoxShrinkPx={inputBoxShrinkPx}
            inputTextLiftPx={inputTextLiftPx}
            dynamicVariables={dynamicVariablesResult.value}
            onCallEvent={handleCallEvent}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Enter an <code>agentId</code> above to load the widget.
          </p>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Host Event Log</h2>
        {eventLog.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Waiting for <code>elevenlabs-convai:call</code> events.
          </p>
        ) : (
          <ul className="space-y-1">
            {eventLog.map((entry) => (
              <li key={entry.id} className="text-sm">
                {entry.text}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
