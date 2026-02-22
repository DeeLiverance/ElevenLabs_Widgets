import type { ConvAIReplicaPreset } from '../types';

import BiotuneGeneratedProfile from './biotune';
import WingspanaiGeneratedProfile from './wingspanai';

export const generatedBrandProfiles: readonly ConvAIReplicaPreset[] = [
  BiotuneGeneratedProfile,
  WingspanaiGeneratedProfile,
] as const;
