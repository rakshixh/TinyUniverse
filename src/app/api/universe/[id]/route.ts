import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUniverseById, updateUniverse, deleteUniverse } from '@/services/universe.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value === SESSION_COOKIE_VALUE;
}

type Params = { params: Promise<{ id: string }> };

/** GET /api/universe/[id] — Fetch specific universe info */
export async function GET(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const universe = await getUniverseById(id);
    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }
    return NextResponse.json({ universe }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch universe' }, { status: 500 });
  }
}

const UpdateUniverseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').trim().optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

/** PATCH /api/universe/[id] — Update universe metadata */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = UpdateUniverseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const universe = await updateUniverse(id, parsed.data);
    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }
    return NextResponse.json({ universe }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update universe' }, { status: 500 });
  }
}

/** DELETE /api/universe/[id] — Dissolve a universe */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await deleteUniverse(id);
    if (!success) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete universe' }, { status: 500 });
  }
}
