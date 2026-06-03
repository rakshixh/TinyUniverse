import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSolarSystems, createSolarSystem } from '@/services/solarsystem.service';
import { isAuthorized } from '@/lib/auth';
import { CONTENT } from '@/lib/content';

/** GET /api/solar-systems?universeId=xxx — List all solar systems for a universe */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const universeId = searchParams.get('universeId');

  if (!universeId) {
    return NextResponse.json({ error: CONTENT.api.errors.required.universeId }, { status: 400 });
  }

  // Check if Admin or authorized Guest
  if (!(await isAuthorized(request, universeId))) {
    return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
  }

  try {
    const systems = await getSolarSystems(universeId);
    return NextResponse.json({ systems }, { status: 200 });
  } catch (err) {
    console.error('Fetch solar systems error:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.fetchSolarSystems }, { status: 500 });
  }
}

const CreateSolarSystemSchema = z.object({
  universeId: z.string().min(1, CONTENT.api.errors.required.universeId),
  name: z.string().min(1, CONTENT.api.errors.required.name).max(100, CONTENT.api.errors.validation.nameTooLong).trim(),
  description: z.string().max(500, CONTENT.api.errors.validation.descTooLong500).optional().default(''),
  starColor: z.string().min(4).max(7).default('#FBBF24'), // Hex color
  starType: z.string().default('dwarf'),
});

/** POST /api/solar-systems — Create a new system inside a universe */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSolarSystemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { universeId, ...inputData } = parsed.data;

    // Check if Admin or authorized Guest
    if (!(await isAuthorized(request, universeId))) {
      return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
    }

    const system = await createSolarSystem(universeId, inputData);
    return NextResponse.json({ system }, { status: 201 });
  } catch (err) {
    console.error('Create solar system error:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.createSolarSystem }, { status: 500 });
  }
}
