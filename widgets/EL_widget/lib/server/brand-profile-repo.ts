import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { ConvAIReplicaPresetSettings } from '@/brand-profiles';

export type RepoBrandProfile = {
  id: string;
  label: string;
  description: string;
  settings: Partial<ConvAIReplicaPresetSettings>;
};

const REPO_PROFILE_DIR = path.join(process.cwd(), 'brand-profiles', 'repo-json');
const GENERATED_PROFILE_DIR = path.join(process.cwd(), 'brand-profiles', 'generated');
const GENERATED_INDEX_FILE = path.join(GENERATED_PROFILE_DIR, 'index.ts');

function sanitizeProfileId(rawId: string): string {
  const normalized = rawId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'new-client';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeProfile(input: unknown): RepoBrandProfile | null {
  if (!isPlainObject(input)) return null;
  if (!isPlainObject(input.settings)) return null;

  const id = sanitizeProfileId(typeof input.id === 'string' ? input.id : '');
  const label =
    typeof input.label === 'string' && input.label.trim() ? input.label.trim() : id;
  const description =
    typeof input.description === 'string' && input.description.trim()
      ? input.description.trim()
      : `${label} preset.`;

  return {
    id,
    label,
    description,
    settings: input.settings as Partial<ConvAIReplicaPresetSettings>,
  };
}

function getProfileFilePath(profileId: string): string {
  return path.join(REPO_PROFILE_DIR, `${sanitizeProfileId(profileId)}.json`);
}

function toPascalCaseProfileName(profileId: string): string {
  const safeId = sanitizeProfileId(profileId);
  const pascal = safeId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return pascal || 'NewClient';
}

function getGeneratedProfileFilePath(profileId: string): string {
  return path.join(GENERATED_PROFILE_DIR, `${sanitizeProfileId(profileId)}.ts`);
}

function buildGeneratedProfileFile(profile: RepoBrandProfile): string {
  const symbolName = `${toPascalCaseProfileName(profile.id)}GeneratedBrandProfile`;
  const serialized = JSON.stringify(profile, null, 2);

  return [
    "import type { ConvAIReplicaPreset } from '../types';",
    '',
    `export const ${symbolName}: ConvAIReplicaPreset = ${serialized};`,
    '',
    `export default ${symbolName};`,
    '',
  ].join('\n');
}

async function writeGeneratedProfileIndex(): Promise<void> {
  await fs.mkdir(GENERATED_PROFILE_DIR, { recursive: true });
  const entries = await fs.readdir(GENERATED_PROFILE_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts')
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const importLines: string[] = [];
  const arrayNames: string[] = [];

  for (const fileName of files) {
    const baseName = fileName.replace(/\.ts$/i, '');
    const importName = `${toPascalCaseProfileName(baseName)}GeneratedProfile`;
    importLines.push(`import ${importName} from './${baseName}';`);
    arrayNames.push(importName);
  }

  const fileContents = [
    "import type { ConvAIReplicaPreset } from '../types';",
    ...(importLines.length > 0 ? [''] : []),
    ...importLines,
    ...(importLines.length > 0 ? [''] : []),
    'export const generatedBrandProfiles: readonly ConvAIReplicaPreset[] = [',
    ...arrayNames.map((name) => `  ${name},`),
    '] as const;',
    '',
  ].join('\n');

  await fs.writeFile(GENERATED_INDEX_FILE, fileContents, 'utf8');
}

export async function listRepoBrandProfiles(): Promise<RepoBrandProfile[]> {
  await fs.mkdir(REPO_PROFILE_DIR, { recursive: true });
  const entries = await fs.readdir(REPO_PROFILE_DIR, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  const profiles = await Promise.all(
    files.map(async (file) => {
      try {
        const raw = await fs.readFile(path.join(REPO_PROFILE_DIR, file.name), 'utf8');
        const parsed = JSON.parse(raw) as unknown;
        return normalizeProfile(parsed);
      } catch {
        return null;
      }
    })
  );

  return profiles
    .filter((profile): profile is RepoBrandProfile => profile !== null)
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function saveRepoBrandProfile(input: unknown): Promise<RepoBrandProfile | null> {
  const profile = normalizeProfile(input);
  if (!profile) return null;

  await fs.mkdir(REPO_PROFILE_DIR, { recursive: true });
  await fs.writeFile(
    getProfileFilePath(profile.id),
    `${JSON.stringify(profile, null, 2)}\n`,
    'utf8'
  );

  return profile;
}

export async function deleteRepoBrandProfile(profileId: string): Promise<boolean> {
  const filePath = getProfileFilePath(profileId);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function saveGeneratedTsBrandProfile(input: unknown): Promise<RepoBrandProfile | null> {
  const profile = normalizeProfile(input);
  if (!profile) return null;

  await fs.mkdir(GENERATED_PROFILE_DIR, { recursive: true });
  await fs.writeFile(
    getGeneratedProfileFilePath(profile.id),
    buildGeneratedProfileFile(profile),
    'utf8'
  );
  await writeGeneratedProfileIndex();

  return profile;
}

export async function deleteGeneratedTsBrandProfile(profileId: string): Promise<boolean> {
  try {
    await fs.unlink(getGeneratedProfileFilePath(profileId));
    await writeGeneratedProfileIndex();
    return true;
  } catch {
    return false;
  }
}
