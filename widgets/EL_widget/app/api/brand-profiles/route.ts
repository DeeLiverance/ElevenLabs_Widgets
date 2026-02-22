import { NextResponse } from 'next/server';

import { listRepoBrandProfiles, saveRepoBrandProfile } from '@/lib/server/brand-profile-repo';

export const runtime = 'nodejs';

export async function GET() {
  const profiles = await listRepoBrandProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const profile = await saveRepoBrandProfile(body);
  if (!profile) {
    return NextResponse.json({ error: 'Invalid brand profile payload.' }, { status: 400 });
  }

  return NextResponse.json({ profile }, { status: 201 });
}
