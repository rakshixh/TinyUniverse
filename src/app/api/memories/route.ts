import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMemories, createMemory } from '@/services/memory.service';
import { getUniverse } from '@/services/universe.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value === SESSION_COOKIE_VALUE;
}

/** GET /api/memories — List all memories */
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const universe = await getUniverse();
    if (!universe) {
      return NextResponse.json({ memories: [] }, { status: 200 });
    }

    const memories = await getMemories(universe._id);
    return NextResponse.json({ memories }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

const CreateMemorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .default(''),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

/** POST /api/memories — Create a new memory */
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const universe = await getUniverse();
    if (!universe) {
      return NextResponse.json(
        { error: 'Universe not found. Please set up your universe first.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = CreateMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const memory = await createMemory(universe._id, {
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || '',
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
