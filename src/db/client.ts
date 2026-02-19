import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
    if (!databasePromise) {
        databasePromise = openDatabaseAsync('albanil.db');
    }
    return databasePromise;
}
