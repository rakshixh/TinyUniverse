import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateMemory, deleteMemory } from '@/services/memory.service';
import { getUniverse } from '@/services/universe.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value === SESSION_COOKIE_VALUE;
}

type Params = { params: Promise<{ id: string }> };

const UpdateMemorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

/** PATCH /api/memories/:id — Update a memory */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const universe = await getUniverse();
    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const memory = await updateMemory(id, universe._id, parsed.data);

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

/** DELETE /api/memories/:id — Delete a memory */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const universe = await getUniverse();
    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    const deleted = await deleteMemory(id, universe._id);

    if (!deleted) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
