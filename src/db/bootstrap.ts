import { getDb } from './client';
import { createSchema } from './schema';
import { clearLegacyFixedDataIfPresent, seedDatabaseIfEmpty } from './seed';

export async function bootstrapDatabase(): Promise<{ seeded: boolean }> {
    const db = await getDb();
    await createSchema(db);
    const clearedLegacy = await clearLegacyFixedDataIfPresent(db);
    const seeded = await seedDatabaseIfEmpty(db);

    if (__DEV__) {
        console.log(`[db] bootstrap complete (clearedLegacy=${clearedLegacy}, seeded=${seeded})`);
    }

    return { seeded };
}
