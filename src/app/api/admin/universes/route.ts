import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUniverses, createUniverse } from '@/services/universe.service';
import { isAdmin } from '@/lib/auth';
import { CONTENT } from '@/lib/content';

/** GET /api/admin/universes — List all universes for Admin Dashboard */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
  }

  try {
    const universes = await getUniverses();
    return NextResponse.json({ universes }, { status: 200 });
  } catch {
    return NextResponse.json({ error: CONTENT.api.errors.server.fetchUniverses }, { status: 500 });
  }
}

const CreateUniverseSchema = z.object({
  title: z.string().min(1, CONTENT.api.errors.required.title).max(100, CONTENT.api.errors.validation.titleTooLong).trim(),
  description: z.string().max(500, CONTENT.api.errors.validation.descTooLong500).optional().default(''),
  accessCode: z.string().min(1, CONTENT.api.errors.required.accessCode).trim(),
});

/** POST /api/admin/universes — Create a new universe with access code */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
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
    return NextResponse.json({ error: CONTENT.api.errors.server.createUniverse }, { status: 500 });
  }
}
