import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Universe from '@/models/Universe';
import SolarSystem from '@/models/SolarSystem';
import Memory from '@/models/Memory';
import type { IUniverse, CreateUniverseInput, UpdateUniverseInput } from '@/types/universe';

function toPlainUniverse(doc: Record<string, unknown>): IUniverse {
  return {
    _id: doc._id?.toString() ?? '',
    title: doc.title as string,
    slug: (doc.slug as string) ?? '',
    description: (doc.description as string) ?? '',
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt as string),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt as string),
    solarSystemCount: (doc.solarSystemCount as number) ?? 0,
    memoryCount: (doc.memoryCount as number) ?? 0,
  };
}

/** Get all universes with counts */
export async function getUniverses(): Promise<IUniverse[]> {
  await connectDB();
  
  // Use aggregation to count systems and memories per universe
  const docs = await Universe.aggregate([
    {
      $lookup: {
        from: 'solarsystems',
        localField: '_id',
        foreignField: 'universeId',
        as: 'systems',
      },
    },
    {
      $lookup: {
        from: 'memories',
        localField: '_id',
        foreignField: 'universeId',
        as: 'memories',
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        solarSystemCount: { $size: '$systems' },
        memoryCount: { $size: '$memories' },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return docs.map((d) => toPlainUniverse(d as Record<string, unknown>));
}

/** Get a universe by ID */
export async function getUniverseById(id: string): Promise<IUniverse | null> {
  await connectDB();
  try {
    const doc = await Universe.findById(id).lean();
    if (!doc) return null;
    return toPlainUniverse(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Get a universe by slug */
export async function getUniverseBySlug(slug: string): Promise<IUniverse | null> {
  await connectDB();
  try {
    const doc = await Universe.findOne({ slug }).lean();
    if (!doc) return null;
    return toPlainUniverse(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Get raw universe by slug (includes accessCodeHash for bcrypt compare) */
export async function getRawUniverseBySlug(slug: string) {
  await connectDB();
  try {
    return await Universe.findOne({ slug }).lean();
  } catch {
    return null;
  }
}

/** Create a new universe with access code hashing and slug generation */
export async function createUniverse(
  input: CreateUniverseInput
): Promise<IUniverse> {
  await connectDB();

  // 1. Hash passcode
  const accessCodeHash = bcrypt.hashSync(input.accessCode, 10);

  // 2. Generate slug
  let slug = input.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    slug = 'universe';
  }

  // Ensure uniqueness
  let exists = await Universe.findOne({ slug });
  let counter = 1;
  const baseSlug = slug;
  while (exists) {
    slug = `${baseSlug}-${counter}`;
    exists = await Universe.findOne({ slug });
    counter++;
  }

  const doc = await Universe.create({
    title: input.title,
    slug,
    description: input.description ?? '',
    accessCodeHash,
  });

  return toPlainUniverse(doc.toObject() as unknown as Record<string, unknown>);
}

/** Update universe details (title, description, or change passcode) */
export async function updateUniverse(
  id: string,
  input: UpdateUniverseInput
): Promise<IUniverse | null> {
  await connectDB();
  try {
    const updateData: Record<string, unknown> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
      
      // Auto slug re-generation on title change
      let slug = input.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
        
      if (!slug) slug = 'universe';

      let exists = await Universe.findOne({ slug, _id: { $ne: id } });
      let counter = 1;
      const baseSlug = slug;
      while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await Universe.findOne({ slug, _id: { $ne: id } });
        counter++;
      }
      updateData.slug = slug;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.accessCode !== undefined && input.accessCode !== '') {
      updateData.accessCodeHash = bcrypt.hashSync(input.accessCode, 10);
    }

    const doc = await Universe.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) return null;
    return toPlainUniverse(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Delete a universe and all its solar systems and memories */
export async function deleteUniverse(id: string): Promise<boolean> {
  await connectDB();
  try {
    await Memory.deleteMany({ universeId: id });
    await SolarSystem.deleteMany({ universeId: id });
    const result = await Universe.deleteOne({ _id: id });
    return result.deletedCount === 1;
  } catch {
    return false;
  }
}
