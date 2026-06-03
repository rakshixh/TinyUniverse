import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSolarSystemById, updateSolarSystem, deleteSolarSystem } from '@/services/solarsystem.service';
import { isAuthorized, isAdmin } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

const UpdateSolarSystemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  starColor: z.string().min(4).max(7).optional(),
  starType: z.string().optional(),
});

/** PATCH /api/solar-systems/[id] — Update solar system details (Admin or authorized Guest) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = UpdateSolarSystemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Retrieve solar system to check its universe ID
    const system = await getSolarSystemById(id);
    if (!system) {
      return NextResponse.json({ error: 'Solar system not found' }, { status: 404 });
    }

    // Check if Admin or authorized Guest of that universe
    if (!(await isAuthorized(request, system.universeId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedSystem = await updateSolarSystem(id, parsed.data);
    if (!updatedSystem) {
      return NextResponse.json({ error: 'Solar system not found' }, { status: 404 });
    }
    return NextResponse.json({ system: updatedSystem }, { status: 200 });
  } catch (err) {
    console.error('Update solar system error:', err);
    return NextResponse.json({ error: 'Failed to update solar system' }, { status: 500 });
  }
}

/** DELETE /api/solar-systems/[id] — Dissolve a solar system (Admin only) */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await deleteSolarSystem(id);
    if (!success) {
      return NextResponse.json({ error: 'Solar system not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Delete solar system error:', err);
    return NextResponse.json({ error: 'Failed to dissolve solar system' }, { status: 500 });
  }
}
