import type { SQLiteDatabase } from 'expo-sqlite';

const DB_VERSION = 1;

export async function createSchema(db: SQLiteDatabase): Promise<void> {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workers (
            id TEXT PRIMARY KEY,
            apodo TEXT NOT NULL,
            nombre_completo TEXT NOT NULL DEFAULT '',
            tarifa REAL NOT NULL,
            tipo TEXT NOT NULL CHECK (tipo IN ('fijo','por_dias')),
            rol TEXT NOT NULL CHECK (rol IN ('albañil','ayudante','carpintero','pintor','varillero','maestro')),
            activo INTEGER NOT NULL CHECK (activo IN (0,1)),
            iniciales TEXT NOT NULL,
            avatar_color_index INTEGER NOT NULL
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS attendance (
            worker_id TEXT NOT NULL,
            date TEXT NOT NULL,
            worked INTEGER NOT NULL CHECK (worked IN (0,1)),
            extra_monto REAL,
            extra_nota TEXT,
            PRIMARY KEY (worker_id, date),
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS advances (
            id TEXT PRIMARY KEY,
            worker_id TEXT NOT NULL,
            worker_apodo TEXT NOT NULL,
            worker_iniciales TEXT NOT NULL,
            avatar_color_index INTEGER NOT NULL,
            monto REAL NOT NULL,
            nota TEXT NOT NULL DEFAULT '',
            fecha_iso TEXT NOT NULL,
            estado TEXT NOT NULL CHECK (estado IN ('pendiente','parcial','descontado')),
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payroll_weeks (
            week_id TEXT PRIMARY KEY,
            week_label TEXT NOT NULL,
            date_range TEXT NOT NULL,
            estado TEXT NOT NULL CHECK (estado IN ('pagada','archivada','en_curso')),
            pagada INTEGER NOT NULL CHECK (pagada IN (0,1)),
            total_amount REAL NOT NULL DEFAULT 0,
            worker_count INTEGER NOT NULL DEFAULT 0,
            is_current INTEGER NOT NULL CHECK (is_current IN (0,1)) DEFAULT 0,
            sort_order INTEGER NOT NULL
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payroll_entries (
            id TEXT PRIMARY KEY,
            week_id TEXT NOT NULL,
            worker_id TEXT NOT NULL,
            dias_trabajados REAL NOT NULL,
            tarifa REAL NOT NULL,
            extras REAL NOT NULL DEFAULT 0,
            adelantos REAL NOT NULL DEFAULT 0,
            FOREIGN KEY (week_id) REFERENCES payroll_weeks(week_id) ON DELETE CASCADE,
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
            UNIQUE (week_id, worker_id)
        );
    `);

    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_advances_fecha ON advances(fecha_iso DESC);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_payroll_entries_week ON payroll_entries(week_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);');

    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
}
