import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMemories, createMemory } from '@/services/memory.service';
import { getSolarSystemById } from '@/services/solarsystem.service';
import { isAuthorized } from '@/lib/auth';

/** GET /api/memories?systemId=xxx — List all memories in a star system */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const systemId = searchParams.get('systemId');

  if (!systemId) {
    return NextResponse.json({ error: 'systemId is required' }, { status: 400 });
  }

  try {
    const system = await getSolarSystemById(systemId);
    if (!system) {
      return NextResponse.json({ error: 'Solar system not found' }, { status: 404 });
    }

    // Check if Admin or authorized Guest
    if (!(await isAuthorized(request, system.universeId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memories = await getMemories(systemId);
    return NextResponse.json({ memories }, { status: 200 });
  } catch (err) {
    console.error('Fetch memories error:', err);
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
  contributorName: z
    .string()
    .min(4, 'Name must be at least 4 characters')
    .max(100)
    .trim(),
  universeId: z.string().min(1, 'Universe ID is required'),
});

/** POST /api/memories — Create a new memory inside a system (Admin or authorized Guest) */
export async function POST(request: NextRequest) {
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

    // Check if Admin or authorized Guest
    if (!(await isAuthorized(request, universeId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map systemId to solarSystemId inside createMemory input
    const memory = await createMemory(universeId, {
      ...inputData,
      solarSystemId: inputData.systemId,
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (err) {
    console.error('Create memory error:', err);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
