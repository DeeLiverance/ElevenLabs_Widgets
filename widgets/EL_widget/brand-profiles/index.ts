import { biotuneBrandProfile } from './biotune';
import { generatedBrandProfiles } from './generated';
import { testBrandAlphaProfile } from './test-brand-alpha';
import { testBrandSunsetProfile } from './test-brand-sunset';
import type { ConvAIReplicaPreset } from './types';

export type { ConvAIReplicaPreset, ConvAIReplicaPresetSettings } from './types';

const brandProfileRegistry = new Map<string, ConvAIReplicaPreset>();

for (const profile of [
  biotuneBrandProfile,
  testBrandAlphaProfile,
  testBrandSunsetProfile,
  ...generatedBrandProfiles,
]) {
  brandProfileRegistry.set(profile.id, profile);
}

export const brandProfiles: readonly ConvAIReplicaPreset[] = Array.from(
  brandProfileRegistry.values()
);
