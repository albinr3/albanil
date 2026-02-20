import type { SQLiteDatabase } from 'expo-sqlite';

export async function clearLegacyFixedDataIfPresent(db: SQLiteDatabase): Promise<boolean> {
    const legacyMarker = await db.getFirstAsync<{ count: number }>(
        `
        SELECT COUNT(*) AS count
        FROM workers
        WHERE id IN ('1','2','3','4','5','6')
            OR apodo IN ('El Flaco','Moreno','Miguelito','Maestro Rubio')
    `
    );

    if ((legacyMarker?.count ?? 0) === 0) return false;

    await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM attendance');
        await db.runAsync('DELETE FROM advances');
        await db.runAsync('DELETE FROM payroll_entries');
        await db.runAsync('DELETE FROM payroll_weeks');
        await db.runAsync('DELETE FROM workers');
    });

    return true;
}

export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<boolean> {
    // Seeding disabled: app starts from an empty database.
    return false;
}
