import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMemories, createMemory } from '@/services/memory.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value === SESSION_COOKIE_VALUE;
}

/** GET /api/memories?systemId=xxx — List all memories for a solar system */
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const systemId = searchParams.get('systemId');

  if (!systemId) {
    return NextResponse.json({ error: 'systemId is required' }, { status: 400 });
  }

  try {
    const memories = await getMemories(systemId);
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
  orbit: z.number().min(1).max(4),
  date: z.string().min(1, 'Date is required'),
  systemId: z.string().min(1, 'System ID is required'),
  universeId: z.string().min(1, 'Universe ID is required'),
});

/** POST /api/memories — Create a new memory in a system */
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { universeId, ...inputData } = parsed.data;

    const memory = await createMemory(universeId, inputData);

    return NextResponse.json({ memory }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
