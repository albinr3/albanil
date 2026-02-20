import type { SQLiteDatabase } from 'expo-sqlite';

const DB_VERSION = 3;

interface TableInfoRow {
    name: string;
}

async function hasColumn(db: SQLiteDatabase, tableName: string, columnName: string): Promise<boolean> {
    const rows = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${tableName});`);
    return rows.some((row) => row.name === columnName);
}

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
            saldo_pendiente REAL NOT NULL DEFAULT 0,
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
            adelantos_override INTEGER NOT NULL DEFAULT 0 CHECK (adelantos_override IN (0,1)),
            FOREIGN KEY (week_id) REFERENCES payroll_weeks(week_id) ON DELETE CASCADE,
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
            UNIQUE (week_id, worker_id)
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    if (!(await hasColumn(db, 'advances', 'saldo_pendiente'))) {
        await db.execAsync(`
            ALTER TABLE advances
            ADD COLUMN saldo_pendiente REAL NOT NULL DEFAULT 0;
        `);
    }
    if (!(await hasColumn(db, 'payroll_entries', 'adelantos_override'))) {
        await db.execAsync(`
            ALTER TABLE payroll_entries
            ADD COLUMN adelantos_override INTEGER NOT NULL DEFAULT 0 CHECK (adelantos_override IN (0,1));
        `);
    }

    await db.execAsync(`
        UPDATE advances
        SET saldo_pendiente = CASE
            WHEN estado = 'descontado' THEN 0
            ELSE monto
        END
        WHERE saldo_pendiente = 0 AND estado != 'descontado';
    `);

    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_advances_fecha ON advances(fecha_iso DESC);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_payroll_entries_week ON payroll_entries(week_id);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);');

    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
}
