import { getDb } from './client';
import type {
    AttendanceRecord,
    ExtraPayment,
    Advance,
    PayrollWorkerEntry,
    WeekHistoryEntry,
    WeekPayroll,
    Worker,
} from '../store/types';

function todayKey(): string {
    return new Date().toISOString().split('T')[0];
}

function boolFromInt(value: number): boolean {
    return value === 1;
}

interface WorkerRow {
    id: string;
    apodo: string;
    nombre_completo: string;
    tarifa: number;
    tipo: Worker['tipo'];
    rol: Worker['rol'];
    activo: number;
    iniciales: string;
    avatar_color_index: number;
}

interface AttendanceRow {
    worker_id: string;
    date: string;
    worked: number;
    extra_monto: number | null;
    extra_nota: string | null;
}

interface AdvanceRow {
    id: string;
    worker_id: string;
    worker_apodo: string;
    worker_iniciales: string;
    avatar_color_index: number;
    monto: number;
    nota: string;
    fecha_iso: string;
    estado: Advance['estado'];
}

interface WeekRow {
    week_id: string;
    week_label: string;
    date_range: string;
    estado: WeekHistoryEntry['estado'];
    pagada: number;
    total_amount: number;
    worker_count: number;
}

interface CurrentPayrollRow {
    week_id: string;
    week_label: string;
    date_range: string;
    pagada: number;
}

interface PayrollEntryRow {
    worker_id: string;
    apodo: string;
    rol: Worker['rol'];
    iniciales: string;
    avatar_color_index: number;
    dias_trabajados: number;
    tarifa: number;
    extras: number;
    adelantos: number;
}

export interface AppSnapshot {
    workers: Worker[];
    attendance: Record<string, AttendanceRecord>;
    advances: Advance[];
    weekHistory: WeekHistoryEntry[];
    payroll: WeekPayroll;
    payrollAdjustments: Record<string, { extras: number; adelantos: number }>;
    weekPagada: boolean;
}

function toWorker(row: WorkerRow): Worker {
    return {
        id: row.id,
        apodo: row.apodo,
        nombreCompleto: row.nombre_completo,
        tarifa: Number(row.tarifa),
        tipo: row.tipo,
        rol: row.rol,
        activo: boolFromInt(row.activo),
        iniciales: row.iniciales,
        avatarColorIndex: Number(row.avatar_color_index),
    };
}

function toAdvance(row: AdvanceRow): Advance {
    return {
        id: row.id,
        workerId: row.worker_id,
        workerApodo: row.worker_apodo,
        workerIniciales: row.worker_iniciales,
        monto: Number(row.monto),
        nota: row.nota,
        fecha: new Date(row.fecha_iso),
        estado: row.estado,
        avatarColorIndex: Number(row.avatar_color_index),
    };
}

function toWeekHistory(row: WeekRow): WeekHistoryEntry {
    return {
        weekId: row.week_id,
        weekLabel: row.week_label,
        dateRange: row.date_range,
        totalAmount: Number(row.total_amount),
        workerCount: Number(row.worker_count),
        estado: row.estado,
    };
}

function toAttendanceMap(rows: AttendanceRow[]): Record<string, AttendanceRecord> {
    const map: Record<string, AttendanceRecord> = {};
    for (const row of rows) {
        const extra: ExtraPayment | undefined =
            row.extra_monto != null
                ? {
                    monto: Number(row.extra_monto),
                    nota: row.extra_nota ?? '',
                }
                : undefined;

        const item: AttendanceRecord = {
            workerId: row.worker_id,
            date: row.date,
            worked: boolFromInt(row.worked),
            extra,
        };
        map[`${row.worker_id}-${row.date}`] = item;
    }
    return map;
}

function emptyPayroll(): WeekPayroll {
    return {
        weekId: 'w-current',
        weekLabel: 'Semana Actual',
        dateRange: '--',
        pagada: false,
        totalSemanal: 0,
        workers: [],
    };
}

export async function fetchWorkers(): Promise<Worker[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkerRow>(
        `
        SELECT id, apodo, nombre_completo, tarifa, tipo, rol, activo, iniciales, avatar_color_index
        FROM workers
        ORDER BY activo DESC, apodo COLLATE NOCASE ASC
    `
    );
    return rows.map(toWorker);
}

export async function fetchTodayAttendance(): Promise<Record<string, AttendanceRecord>> {
    const db = await getDb();
    const rows = await db.getAllAsync<AttendanceRow>(
        `
        SELECT worker_id, date, worked, extra_monto, extra_nota
        FROM attendance
        WHERE date = ?
    `,
        todayKey()
    );
    return toAttendanceMap(rows);
}

export async function fetchAdvances(): Promise<Advance[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<AdvanceRow>(
        `
        SELECT id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, nota, fecha_iso, estado
        FROM advances
        ORDER BY fecha_iso DESC
    `
    );
    return rows.map(toAdvance);
}

export async function fetchWeekHistory(): Promise<WeekHistoryEntry[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<WeekRow>(
        `
        SELECT week_id, week_label, date_range, estado, pagada, total_amount, worker_count
        FROM payroll_weeks
        ORDER BY sort_order ASC
    `
    );
    return rows.map(toWeekHistory);
}

export async function fetchCurrentPayroll(): Promise<WeekPayroll> {
    const db = await getDb();
    const current = await db.getFirstAsync<CurrentPayrollRow>(
        `
        SELECT week_id, week_label, date_range, pagada
        FROM payroll_weeks
        WHERE is_current = 1
        LIMIT 1
    `
    );

    if (!current) {
        return emptyPayroll();
    }

    const rows = await db.getAllAsync<PayrollEntryRow>(
        `
        SELECT
            w.id AS worker_id,
            w.apodo,
            w.rol,
            w.iniciales,
            w.avatar_color_index,
            COALESCE(pe.dias_trabajados, 5) AS dias_trabajados,
            COALESCE(pe.tarifa, w.tarifa) AS tarifa,
            COALESCE(pe.extras, 0) AS extras,
            COALESCE(pe.adelantos, 0) AS adelantos
        FROM workers w
        LEFT JOIN payroll_entries pe
            ON pe.worker_id = w.id AND pe.week_id = ?
        WHERE w.activo = 1
        ORDER BY w.apodo COLLATE NOCASE ASC
    `,
        current.week_id
    );

    const entries: PayrollWorkerEntry[] = rows.map((row) => {
        const dias = Number(row.dias_trabajados);
        const tarifa = Number(row.tarifa);
        const extras = Number(row.extras);
        const adelantos = Number(row.adelantos);
        const totalDias = dias * tarifa;

        return {
            workerId: row.worker_id,
            apodo: row.apodo,
            rol: row.rol,
            iniciales: row.iniciales,
            avatarColorIndex: Number(row.avatar_color_index),
            diasTrabajados: dias,
            tarifa,
            totalDias,
            extras,
            adelantos,
            totalPagar: totalDias + extras - adelantos,
        };
    });

    const totalSemanal = entries.reduce((acc, item) => acc + item.totalPagar, 0);

    return {
        weekId: current.week_id,
        weekLabel: current.week_label,
        dateRange: current.date_range,
        pagada: boolFromInt(current.pagada),
        totalSemanal,
        workers: entries,
    };
}

export function payrollToAdjustments(payroll: WeekPayroll): Record<string, { extras: number; adelantos: number }> {
    const map: Record<string, { extras: number; adelantos: number }> = {};
    for (const worker of payroll.workers) {
        map[worker.workerId] = {
            extras: worker.extras,
            adelantos: worker.adelantos,
        };
    }
    return map;
}

export async function loadAppSnapshot(): Promise<AppSnapshot> {
    const [workers, attendance, advances, weekHistory, payroll] = await Promise.all([
        fetchWorkers(),
        fetchTodayAttendance(),
        fetchAdvances(),
        fetchWeekHistory(),
        fetchCurrentPayroll(),
    ]);

    return {
        workers,
        attendance,
        advances,
        weekHistory,
        payroll,
        payrollAdjustments: payrollToAdjustments(payroll),
        weekPagada: payroll.pagada,
    };
}

export async function toggleAttendanceForToday(workerId: string): Promise<void> {
    const db = await getDb();
    const date = todayKey();
    const current = await db.getFirstAsync<{ worked: number }>(
        `
        SELECT worked
        FROM attendance
        WHERE worker_id = ? AND date = ?
    `,
        workerId,
        date
    );
    const nextWorked = current ? (current.worked === 1 ? 0 : 1) : 1;

    await db.runAsync(
        `
        INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
        VALUES (?, ?, ?, NULL, NULL)
        ON CONFLICT(worker_id, date) DO UPDATE SET
            worked = excluded.worked
    `,
        workerId,
        date,
        nextWorked
    );
}

export async function setExtraForToday(workerId: string, extra: ExtraPayment | undefined): Promise<void> {
    const db = await getDb();
    const date = todayKey();
    const monto = extra?.monto ?? null;
    const nota = extra?.nota ?? null;

    await db.runAsync(
        `
        INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
        VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(worker_id, date) DO UPDATE SET
            worked = 1,
            extra_monto = excluded.extra_monto,
            extra_nota = excluded.extra_nota
    `,
        workerId,
        date,
        monto,
        nota
    );
}

export async function addAdvanceRecord(input: {
    workerId: string;
    workerApodo: string;
    workerIniciales: string;
    avatarColorIndex: number;
    monto: number;
    nota: string;
}): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `
        INSERT INTO advances (
            id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, nota, fecha_iso, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        `a${Date.now()}`,
        input.workerId,
        input.workerApodo,
        input.workerIniciales,
        input.avatarColorIndex,
        input.monto,
        input.nota,
        new Date().toISOString(),
        'pendiente'
    );
}

async function getCurrentWeekId(db: Awaited<ReturnType<typeof getDb>>): Promise<string | null> {
    const row = await db.getFirstAsync<{ week_id: string }>(
        `
        SELECT week_id
        FROM payroll_weeks
        WHERE is_current = 1
        LIMIT 1
    `
    );
    return row?.week_id ?? null;
}

export async function addWorkerRecord(worker: Worker): Promise<void> {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            INSERT INTO workers (
                id, apodo, nombre_completo, tarifa, tipo, rol, activo, iniciales, avatar_color_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            worker.id,
            worker.apodo,
            worker.nombreCompleto,
            worker.tarifa,
            worker.tipo,
            worker.rol,
            worker.activo ? 1 : 0,
            worker.iniciales,
            worker.avatarColorIndex
        );

        const weekId = await getCurrentWeekId(db);
        if (weekId) {
            await db.runAsync(
                `
                INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(week_id, worker_id) DO NOTHING
            `,
                `${weekId}-${worker.id}`,
                weekId,
                worker.id,
                5,
                worker.tarifa,
                0,
                0
            );
        }
    });
}

export async function setCurrentWeekPayrollAdjustment(workerId: string, extras: number, adelantos: number): Promise<void> {
    const db = await getDb();
    const weekId = await getCurrentWeekId(db);
    if (!weekId) return;

    const existing = await db.getFirstAsync<{ dias_trabajados: number; tarifa: number }>(
        `
        SELECT dias_trabajados, tarifa
        FROM payroll_entries
        WHERE week_id = ? AND worker_id = ?
    `,
        weekId,
        workerId
    );

    const worker = await db.getFirstAsync<{ tarifa: number }>(
        `
        SELECT tarifa
        FROM workers
        WHERE id = ?
        LIMIT 1
    `,
        workerId
    );

    const dias = existing?.dias_trabajados ?? 5;
    const tarifa = existing?.tarifa ?? worker?.tarifa ?? 0;

    await db.runAsync(
        `
        INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(week_id, worker_id) DO UPDATE SET
            extras = excluded.extras,
            adelantos = excluded.adelantos
    `,
        `${weekId}-${workerId}`,
        weekId,
        workerId,
        dias,
        tarifa,
        Math.max(0, extras || 0),
        Math.max(0, adelantos || 0)
    );
}

export async function markCurrentWeekAsPaid(): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `
        UPDATE payroll_weeks
        SET pagada = 1, estado = 'pagada'
        WHERE is_current = 1
    `
    );
}
