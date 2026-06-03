import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateUniverse, deleteUniverse } from '@/services/universe.service';
import { isAdmin } from '@/lib/auth';
import { CONTENT } from '@/lib/content';

type Params = { params: Promise<{ id: string }> };

const UpdateUniverseSchema = z.object({
  title: z.string().min(1, CONTENT.api.errors.required.title).max(100, CONTENT.api.errors.validation.titleTooLong).trim().optional(),
  description: z.string().max(500, CONTENT.api.errors.validation.descTooLong500).optional(),
  accessCode: z.string().trim().optional(),
});

/** PATCH /api/admin/universes/[id] — Update universe details */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
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
      return NextResponse.json({ error: CONTENT.api.errors.notFound.universe }, { status: 404 });
    }
    return NextResponse.json({ universe }, { status: 200 });
  } catch (err) {
    console.error('Failed to update universe:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.updateUniverse }, { status: 500 });
  }
}

/** DELETE /api/admin/universes/[id] — Dissolve a universe */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await deleteUniverse(id);
    if (!success) {
      return NextResponse.json({ error: CONTENT.api.errors.notFound.universe }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to delete universe:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.deleteUniverse }, { status: 500 });
  }
}
