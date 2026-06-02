import connectDB from '@/lib/mongodb';
import SolarSystem from '@/models/SolarSystem';
import Memory from '@/models/Memory';
import type { ISolarSystem, CreateSolarSystemInput, UpdateSolarSystemInput } from '@/types/solarsystem';

function toPlainSolarSystem(doc: Record<string, unknown>): ISolarSystem {
  return {
    _id: doc._id?.toString() ?? '',
    universeId: doc.universeId?.toString() ?? '',
    name: doc.name as string,
    description: (doc.description as string) ?? '',
    starColor: doc.starColor as string,
    starType: doc.starType as string,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

/** Fetch all solar systems in a universe */
export async function getSolarSystems(universeId: string): Promise<ISolarSystem[]> {
  await connectDB();
  const docs = await SolarSystem.find({ universeId }).sort({ createdAt: 1 }).lean();
  return docs.map((d) => toPlainSolarSystem(d as Record<string, unknown>));
}

/** Fetch a specific solar system by ID */
export async function getSolarSystemById(id: string): Promise<ISolarSystem | null> {
  await connectDB();
  try {
    const doc = await SolarSystem.findById(id).lean();
    if (!doc) return null;
    return toPlainSolarSystem(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Create a new solar system */
export async function createSolarSystem(
  universeId: string,
  input: CreateSolarSystemInput
): Promise<ISolarSystem> {
  await connectDB();

  const doc = await SolarSystem.create({
    universeId,
    name: input.name,
    description: input.description ?? '',
    starColor: input.starColor ?? '#FBBF24',
    starType: input.starType ?? 'dwarf',
  });

  return toPlainSolarSystem(doc.toObject() as unknown as Record<string, unknown>);
}

/** Delete a solar system and all its memories */
export async function deleteSolarSystem(id: string): Promise<boolean> {
  await connectDB();
  try {
    // Delete system memories first
    await Memory.deleteMany({ systemId: id });
    const result = await SolarSystem.deleteOne({ _id: id });
    return result.deletedCount === 1;
  } catch {
    return false;
  }
}

/** Update a solar system's details */
export async function updateSolarSystem(
  id: string,
  input: UpdateSolarSystemInput
): Promise<ISolarSystem | null> {
  await connectDB();
  try {
    const doc = await SolarSystem.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return null;
    return toPlainSolarSystem(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}
