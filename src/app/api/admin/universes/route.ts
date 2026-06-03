import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUniverses, createUniverse } from '@/services/universe.service';
import { isAdmin } from '@/lib/auth';

/** GET /api/admin/universes — List all universes for Admin Dashboard */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const universes = await getUniverses();
    return NextResponse.json({ universes }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch universes' }, { status: 500 });
  }
}

const CreateUniverseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').trim(),
  description: z.string().max(500, 'Description too long').optional().default(''),
  accessCode: z.string().min(1, 'Access code is required').trim(),
});

/** POST /api/admin/universes — Create a new universe with access code */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateUniverseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const universe = await createUniverse(parsed.data);
    return NextResponse.json({ universe }, { status: 201 });
  } catch (err) {
    console.error('Failed to create universe:', err);
    return NextResponse.json({ error: 'Failed to create universe' }, { status: 500 });
  }
}
