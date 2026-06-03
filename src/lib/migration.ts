import bcrypt from 'bcryptjs';
import Universe from '@/models/Universe';
import SolarSystem from '@/models/SolarSystem';
import Memory from '@/models/Memory';

declare global {
  var __migrationRun: boolean | undefined;
}

export async function runMigration(): Promise<void> {
  if (global.__migrationRun) {
    return;
  }

  try {
    console.log('🔄 Checking database migration...');

    // 1. Check if there are solar systems or memories but no universes
    const universeCount = await Universe.countDocuments();
    const systemCount = await SolarSystem.countDocuments();
    const memoryCount = await Memory.countDocuments();

    console.log(`📊 Current DB Stats: Universes: ${universeCount}, Systems: ${systemCount}, Memories: ${memoryCount}`);

    let defaultUniverseId = null;

    if (universeCount === 0 && (systemCount > 0 || memoryCount > 0)) {
      console.log('🚨 Orphaned data found but no universes exist. Creating default "Original Universe"...');
      
      // Hash a default passcode "1234"
      const defaultPasscode = '1234';
      const hash = bcrypt.hashSync(defaultPasscode, 10);
      
      const defaultUniverse = await Universe.create({
        title: 'Original Universe',
        slug: 'original-universe',
        description: 'The default universe created for existing star systems and memories.',
        accessCodeHash: hash,
      });
      
      defaultUniverseId = defaultUniverse._id;
      console.log(`✅ Default Universe created with ID: ${defaultUniverseId} (Unlock code: ${defaultPasscode})`);
    } else if (universeCount > 0) {
      // If universes already exist, get the first one as default fallback
      const firstUniverse = await Universe.findOne().sort({ createdAt: 1 });
      if (firstUniverse) {
        defaultUniverseId = firstUniverse._id;
      }
    }

    // 1.5. Migrate existing universes to ensure they have valid unique slugs and accessCodeHashes
    const allUniverses = await Universe.find();
    console.log(`🔍 Inspecting ${allUniverses.length} universes for slug/passcode migration...`);
    for (const univ of allUniverses) {
      let updated = false;

      // Fix missing/empty slug
      if (!univ.slug) {
        let slug = univ.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (!slug) slug = 'universe';

        // Ensure uniqueness
        let exists = await Universe.findOne({ slug, _id: { $ne: univ._id } });
        let counter = 1;
        const baseSlug = slug;
        while (exists) {
          slug = `${baseSlug}-${counter}`;
          exists = await Universe.findOne({ slug, _id: { $ne: univ._id } });
          counter++;
        }
        univ.slug = slug;
        updated = true;
        console.log(`✏️ Generated slug "${slug}" for universe "${univ.title}"`);
      }

      // Fix missing accessCodeHash
      if (!univ.accessCodeHash) {
        const defaultPasscode = process.env.UNIVERSE_PASSCODE || '1234';
        univ.accessCodeHash = bcrypt.hashSync(defaultPasscode, 10);
        updated = true;
        console.log(`🔑 Generated default accessCodeHash (from env/1234) for universe "${univ.title}"`);
      }

      if (updated) {
        await univ.save();
      }
    }

    // If we have a default universe ID, migrate orphaned records
    if (defaultUniverseId) {
      // 2. Migrate SolarSystems
      const systemsToMigrate = await SolarSystem.find({
        $or: [
          { universeId: { $exists: false } },
          { universeId: null },
          { title: { $exists: false } },
          { title: '' }
        ]
      });

      if (systemsToMigrate.length > 0) {
        console.log(`⚙️ Migrating ${systemsToMigrate.length} solar systems...`);
        for (const system of systemsToMigrate) {
          if (!system.universeId) {
            system.universeId = defaultUniverseId;
          }
          if (!system.title) {
            system.title = system.name || 'Unnamed Star System';
          }
          // Set name field as well to keep them in sync
          if (!system.name) {
            system.name = system.title;
          }
          await system.save();
        }
        console.log('✅ Solar systems migrated.');
      }

      // 3. Migrate Memories
      const memoriesToMigrate = await Memory.find({
        $or: [
          { universeId: { $exists: false } },
          { universeId: null },
          { solarSystemId: { $exists: false } },
          { solarSystemId: null }
        ]
      });

      if (memoriesToMigrate.length > 0) {
        console.log(`⚙️ Migrating ${memoriesToMigrate.length} memories...`);
        for (const memory of memoriesToMigrate) {
          if (!memory.universeId) {
            memory.universeId = defaultUniverseId;
          }
          if (!memory.solarSystemId) {
            memory.solarSystemId = (memory.systemId || null) as unknown as typeof memory.solarSystemId;
          }
          // Maintain compatibility
          if (!memory.systemId) {
            memory.systemId = memory.solarSystemId;
          }
          await memory.save();
        }
        console.log('✅ Memories migrated.');
      }
    }

    global.__migrationRun = true;
    console.log('✅ Database migration check completed.');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  }
}
