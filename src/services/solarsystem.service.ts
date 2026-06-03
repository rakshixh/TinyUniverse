import connectDB from '@/lib/mongodb';
import SolarSystem from '@/models/SolarSystem';
import Memory from '@/models/Memory';
import type { ISolarSystem, CreateSolarSystemInput, UpdateSolarSystemInput } from '@/types/solarsystem';

function toPlainSolarSystem(doc: Record<string, unknown>): ISolarSystem {
  const title = (doc.title as string) ?? (doc.name as string) ?? 'Unnamed Star System';
  return {
    _id: doc._id?.toString() ?? '',
    universeId: doc.universeId?.toString() ?? '',
    title,
    name: title, // Support both
    description: (doc.description as string) ?? '',
    starColor: (doc.starColor as string) ?? '#FBBF24',
    starType: (doc.starType as string) ?? 'dwarf',
    orbit: (doc.orbit as number) ?? 0,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt as string),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt as string),
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

  const title = input.title ?? input.name;

  const doc = await SolarSystem.create({
    universeId,
    title,
    name: title,
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
    await Memory.deleteMany({ solarSystemId: id });
    await Memory.deleteMany({ systemId: id }); // Cleanup legacy
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
    const updateData: Record<string, unknown> = { ...input };
    if (input.name && !input.title) {
      updateData.title = input.name;
    } else if (input.title && !input.name) {
      updateData.name = input.title;
    }

    const doc = await SolarSystem.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return null;
    return toPlainSolarSystem(doc as Record<string, unknown>);
  } catch {
    return null;
  }
}
