import { NextResponse } from 'next/server';

import {
  deleteGeneratedTsBrandProfile,
  saveGeneratedTsBrandProfile,
} from '@/lib/server/brand-profile-repo';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const profile = await saveGeneratedTsBrandProfile(body);
  if (!profile) {
    return NextResponse.json({ error: 'Invalid brand profile payload.' }, { status: 400 });
  }

  return NextResponse.json(
    {
      profile,
      generatedFilePath: `brand-profiles/generated/${profile.id}.ts`,
      generatedIndexPath: 'brand-profiles/generated/index.ts',
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('id');

  if (!profileId) {
    return NextResponse.json({ error: 'Missing id query parameter.' }, { status: 400 });
  }

  const deleted = await deleteGeneratedTsBrandProfile(profileId);
  if (!deleted) {
    return NextResponse.json({ error: 'Generated TS preset not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
