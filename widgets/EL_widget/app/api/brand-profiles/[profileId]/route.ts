import { NextResponse } from 'next/server';

import { deleteRepoBrandProfile } from '@/lib/server/brand-profile-repo';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const { profileId } = await context.params;
  const deleted = await deleteRepoBrandProfile(profileId);

  if (!deleted) {
    return NextResponse.json({ error: 'Brand profile not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
