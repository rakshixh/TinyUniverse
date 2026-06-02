import connectDB from '@/lib/mongodb';
import Universe from '@/models/Universe';
import type { IUniverse, CreateUniverseInput } from '@/types/universe';

function toPlainUniverse(doc: Record<string, unknown>): IUniverse {
  return {
    _id: doc._id?.toString() ?? '',
    title: doc.title as string,
    description: (doc.description as string) ?? '',
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

/** Get the first (and only) universe */
export async function getUniverse(): Promise<IUniverse | null> {
  await connectDB();
  const doc = await Universe.findOne({}).lean();
  if (!doc) return null;
  return toPlainUniverse(doc as Record<string, unknown>);
}

/** Create the universe (called from setup page) */
export async function createUniverse(
  input: CreateUniverseInput
): Promise<IUniverse> {
  await connectDB();

  // Only one universe allowed
  const existing = await Universe.findOne({}).lean();
  if (existing) {
    return toPlainUniverse(existing as Record<string, unknown>);
  }

  const doc = await Universe.create({
    title: input.title,
    description: input.description ?? '',
  });

  return toPlainUniverse(doc.toObject() as unknown as Record<string, unknown>);
}
