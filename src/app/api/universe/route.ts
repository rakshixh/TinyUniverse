import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUniverses, createUniverse } from '@/services/universe.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value === SESSION_COOKIE_VALUE;
}

/** GET /api/universe — List all universes */
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
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
});

/** POST /api/universe — Create a new universe */
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
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
  } catch {
    return NextResponse.json({ error: 'Failed to create universe' }, { status: 500 });
  }
}
