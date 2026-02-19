import { getDb } from './client';
import { createSchema } from './schema';
import { seedDatabaseIfEmpty } from './seed';

export async function bootstrapDatabase(): Promise<{ seeded: boolean }> {
    const db = await getDb();
    await createSchema(db);
    const seeded = await seedDatabaseIfEmpty(db);

    if (__DEV__) {
        console.log(`[db] bootstrap complete (seeded=${seeded})`);
    }

    return { seeded };
}
