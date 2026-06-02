import connectDB from '@/lib/mongodb';
import Universe from '@/models/Universe';
import SolarSystem from '@/models/SolarSystem';
import Memory from '@/models/Memory';
import type { IUniverse, CreateUniverseInput, UpdateUniverseInput } from '@/types/universe';

function toPlainUniverse(doc: Record<string, unknown>): IUniverse {
  return {
    _id: doc._id?.toString() ?? '',
    title: doc.title as string,
    description: (doc.description as string) ?? '',
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

/** Get all universes */
export async function getUniverses(): Promise<IUniverse[]> {
  await connectDB();
  const docs = await Universe.find({}).sort({ createdAt: -1 }).lean();
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

/** Create a new universe */
export async function createUniverse(
  input: CreateUniverseInput
): Promise<IUniverse> {
  await connectDB();

  const doc = await Universe.create({
    title: input.title,
    description: input.description ?? '',
  });

  return toPlainUniverse(doc.toObject() as unknown as Record<string, unknown>);
}

/** Update universe details */
export async function updateUniverse(
  id: string,
  input: UpdateUniverseInput
): Promise<IUniverse | null> {
  await connectDB();
  try {
    const doc = await Universe.findByIdAndUpdate(
      id,
      { $set: input },
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
