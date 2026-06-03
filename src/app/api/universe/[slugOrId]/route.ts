import { NextRequest, NextResponse } from 'next/server';
import { getUniverseById, getUniverseBySlug } from '@/services/universe.service';
import { isAuthorized } from '@/lib/auth';
import { CONTENT } from '@/lib/content';

type Params = { params: Promise<{ slugOrId: string }> };

/** GET /api/universe/[slugOrId] — Fetch universe info by ID or by slug */
export async function GET(request: NextRequest, { params }: Params) {
  const { slugOrId } = await params;

  if (!slugOrId) {
    return NextResponse.json({ error: CONTENT.api.errors.required.param }, { status: 400 });
  }

  // Detect if parameter is a 24-character hex ID (MongoDB ObjectId)
  const isId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

  try {
    const universe = isId
      ? await getUniverseById(slugOrId)
      : await getUniverseBySlug(slugOrId);

    if (!universe) {
      return NextResponse.json({ error: CONTENT.api.errors.notFound.universe }, { status: 404 });
    }

    // Secure check: if it is by ID (internal fetch from canvas/systems hub),
    // ensure the guest has access cookie or is admin.
    // If it is by slug (public unlock page query), we can expose basic title/description
    // so the unlock screen knows which universe name to render.
    if (isId && !(await isAuthorized(request, universe._id))) {
      return NextResponse.json({ error: CONTENT.api.errors.unauthorized }, { status: 401 });
    }

    return NextResponse.json({ universe }, { status: 200 });
  } catch (err) {
    console.error('Fetch universe error:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.fetchUniverse }, { status: 500 });
  }
}
