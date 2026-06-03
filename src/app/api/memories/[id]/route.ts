import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMemory, deleteMemory } from '@/services/memory.service';
import { isAuthorized, isAdmin } from '@/lib/auth';
import { CONTENT } from '@/lib/content';

type Params = { params: Promise<{ id: string }> };

const UpdateMemorySchema = z.object({
  title: z
    .string()
    .min(1, CONTENT.api.errors.required.title)
    .max(100, CONTENT.api.errors.validation.titleTooLong)
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, CONTENT.api.errors.validation.descTooLong1000)
    .optional(),
  orbit: z.number().min(1).max(4).optional(),
  date: z.string().optional(),
  contributorName: z
    .string()
    .min(4, CONTENT.memoryModal.editMode.fieldContributorMinError)
    .max(100)
    .trim(),
  universeId: z.string().min(1, CONTENT.api.errors.required.universeId),
});

/** PATCH /api/memories/:id — Update a memory (Admin or authorized Guest) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = UpdateMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { universeId, ...updateData } = parsed.data;

    // Check if Admin or authorized Guest
    if (!(await isAuthorized(request, universeId))) {
      return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
    }

    const memory = await updateMemory(id, universeId, updateData);

    if (!memory) {
      return NextResponse.json({ error: CONTENT.api.errors.notFound.memory }, { status: 404 });
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch (err) {
    console.error('Update memory error:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.updateMemory }, { status: 500 });
  }
}

/** DELETE /api/memories/:id — Delete a memory (Admin only) */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const universeId = searchParams.get('universeId');

  if (!universeId) {
    return NextResponse.json({ error: CONTENT.api.errors.required.universeIdParam }, { status: 400 });
  }

  try {
    const deleted = await deleteMemory(id, universeId);

    if (!deleted) {
      return NextResponse.json({ error: CONTENT.api.errors.notFound.memory }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Delete memory error:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.deleteMemory }, { status: 500 });
  }
}
