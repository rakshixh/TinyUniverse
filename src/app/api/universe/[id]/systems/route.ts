import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSolarSystems, createSolarSystem, deleteSolarSystem, updateSolarSystem } from '@/services/solarsystem.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return cookie?.value === SESSION_COOKIE_VALUE;
}

type Params = { params: Promise<{ id: string }> };

/** GET /api/universe/[id]/systems — Fetch all systems inside a universe */
export async function GET(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: universeId } = await params;

  try {
    const systems = await getSolarSystems(universeId);
    return NextResponse.json({ systems }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch solar systems' }, { status: 500 });
  }
}

const CreateSolarSystemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  description: z.string().max(500, 'Description too long').optional().default(''),
  starColor: z.string().min(4).max(7).default('#FBBF24'), // Hex color
  starType: z.string().default('dwarf'),
});

/** POST /api/universe/[id]/systems — Create a new system inside a universe */
export async function POST(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: universeId } = await params;

  try {
    const body = await request.json();
    const parsed = CreateSolarSystemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const system = await createSolarSystem(universeId, parsed.data);
    return NextResponse.json({ system }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create solar system' }, { status: 500 });
  }
}

/** DELETE /api/universe/[id]/systems?systemId=xxx — Dissolve a star system */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const systemId = searchParams.get('systemId');

  if (!systemId) {
    return NextResponse.json({ error: 'systemId is required' }, { status: 400 });
  }

  try {
    const success = await deleteSolarSystem(systemId);
    if (!success) {
      return NextResponse.json({ error: 'Solar system not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to dissolve solar system' }, { status: 500 });
  }
}

const UpdateSolarSystemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  starColor: z.string().min(4).max(7).optional(),
  starType: z.string().optional(),
});

/** PATCH /api/universe/[id]/systems?systemId=xxx — Update solar system details */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const systemId = searchParams.get('systemId');

  if (!systemId) {
    return NextResponse.json({ error: 'systemId is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = UpdateSolarSystemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const system = await updateSolarSystem(systemId, parsed.data);
    if (!system) {
      return NextResponse.json({ error: 'Solar system not found' }, { status: 404 });
    }
    return NextResponse.json({ system }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update solar system' }, { status: 500 });
  }
}
