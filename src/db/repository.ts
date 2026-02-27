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
    return toLocalIsoDate(new Date());
}

function boolFromInt(value: number): boolean {
    return value === 1;
}

function toLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentWeekRangeIso(): { weekStart: string; weekEnd: string } {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 5); // Monday -> Saturday

    return { weekStart: toLocalIsoDate(start), weekEnd: toLocalIsoDate(end) };
}

function formatWeekLabelFromIsoRange(weekStartIso: string, weekEndIso: string): { weekLabel: string; dateRange: string } {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [sy, sm, sd] = weekStartIso.split('-').map(Number);
    const [ey, em, ed] = weekEndIso.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];
    const dateRange = `${startDay}-${endDay} ${endMonth}`;
    return {
        weekLabel: `Semana ${dateRange}`,
        dateRange,
    };
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
    extra_tipo: ExtraPayment['tipo'] | null;
}

interface AdvanceRow {
    id: string;
    worker_id: string;
    worker_apodo: string;
    worker_iniciales: string;
    avatar_color_index: number;
    monto: number;
    saldo_pendiente: number;
    nota: string;
    fecha_iso: string;
    estado: Advance['estado'];
}

interface LastWorkedRow {
    worker_id: string;
    last_date: string;
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

interface CurrentPayrollEntryRow {
    worker_id: string;
    apodo: string;
    rol: Worker['rol'];
    iniciales: string;
    avatar_color_index: number;
    dias_base: number;
    dias_asistencia: number;
    tarifa: number;
    extras_base: number;
    extras_asistencia: number;
    adelantos_base: number;
    adelantos_override: number;
    deuda_pendiente: number;
}

interface WorkerPayrollHistoryRow {
    week_id: string;
    week_label: string;
    date_range: string;
    estado: WeekHistoryEntry['estado'];
    pagada: number;
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

export interface WorkerPayrollHistoryEntry {
    weekId: string;
    weekLabel: string;
    dateRange: string;
    estado: WeekHistoryEntry['estado'];
    pagada: boolean;
    diasTrabajados: number;
    tarifa: number;
    extras: number;
    adelantos: number;
    totalPagar: number;
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
        saldoPendiente: Number(row.saldo_pendiente),
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
                    tipo: row.extra_tipo === 'medio_dia' ? 'medio_dia' : 'general',
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

function createAdvanceId(): string {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `a${Date.now()}-${randomPart}`;
}

function shouldIncludePayrollEntry(entry: PayrollWorkerEntry): boolean {
    return entry.diasTrabajados > 0;
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
    return fetchAttendanceByDate(todayKey());
}

export async function fetchAttendanceByDate(date: string): Promise<Record<string, AttendanceRecord>> {
    const db = await getDb();
    const rows = await db.getAllAsync<AttendanceRow>(
        `
        SELECT worker_id, date, worked, extra_monto, extra_nota, extra_tipo
        FROM attendance
        WHERE date = ?
    `,
        date
    );
    return toAttendanceMap(rows);
}

export async function fetchAdvances(): Promise<Advance[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<AdvanceRow>(
        `
        SELECT id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, saldo_pendiente, nota, fecha_iso, estado
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
    const { weekStart, weekEnd } = getCurrentWeekRangeIso();
    const current = await ensureCurrentWeekRow(db);

    const rows = await db.getAllAsync<CurrentPayrollEntryRow>(
        `
        SELECT
            w.id AS worker_id,
            w.apodo,
            w.rol,
            w.iniciales,
            w.avatar_color_index,
            COALESCE(pe.dias_trabajados, 0) AS dias_base,
            COALESCE(att.dias_trabajados, 0) AS dias_asistencia,
            COALESCE(pe.tarifa, w.tarifa) AS tarifa,
            COALESCE(pe.extras, 0) AS extras_base,
            COALESCE(att.extras, 0) AS extras_asistencia,
            COALESCE(pe.adelantos, 0) AS adelantos_base,
            COALESCE(pe.adelantos_override, 0) AS adelantos_override,
            COALESCE(adv.deuda_pendiente, 0) AS deuda_pendiente
        FROM workers w
        LEFT JOIN payroll_entries pe
            ON pe.worker_id = w.id AND pe.week_id = ?
        LEFT JOIN (
            SELECT
                worker_id,
                SUM(
                    CASE
                        WHEN worked = 1 THEN 1
                        WHEN worked = 0 AND extra_tipo = 'medio_dia' THEN 0.5
                        ELSE 0
                    END
                ) AS dias_trabajados,
                SUM(CASE WHEN worked = 1 THEN COALESCE(extra_monto, 0) ELSE 0 END) AS extras
            FROM attendance
            WHERE date >= ? AND date <= ?
            GROUP BY worker_id
        ) att
            ON att.worker_id = w.id
        LEFT JOIN (
            SELECT
                worker_id,
                SUM(
                    CASE
                        WHEN estado = 'descontado' THEN 0
                        ELSE COALESCE(saldo_pendiente, monto, 0)
                    END
                ) AS deuda_pendiente
            FROM advances
            GROUP BY worker_id
        ) adv
            ON adv.worker_id = w.id
        WHERE w.activo = 1
        ORDER BY w.apodo COLLATE NOCASE ASC
    `,
        current.week_id,
        weekStart,
        weekEnd
    );

    const entries: PayrollWorkerEntry[] = rows.map((row) => {
        const semanaPagada = boolFromInt(current.pagada);
        const diasBase = Number(row.dias_base);
        const diasAsistencia = Number(row.dias_asistencia);
        const dias = semanaPagada ? diasBase : diasAsistencia;
        const tarifa = Number(row.tarifa);
        const extrasBase = Number(row.extras_base);
        const extrasAsistencia = Number(row.extras_asistencia);
        const extras = semanaPagada ? extrasBase : extrasBase + extrasAsistencia;
        const deudaPendiente = Math.max(0, Number(row.deuda_pendiente));
        const adelantosBase = Math.max(0, Number(row.adelantos_base));
        const adelantosOverride = boolFromInt(Number(row.adelantos_override));
        const adelantos = semanaPagada
            ? adelantosBase
            : adelantosOverride
                ? Math.min(adelantosBase, deudaPendiente)
                : deudaPendiente;
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
    }).filter(shouldIncludePayrollEntry);

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

export async function fetchLastWorkedDates(): Promise<Record<string, string>> {
    const db = await getDb();
    const rows = await db.getAllAsync<LastWorkedRow>(
        `
        SELECT worker_id, MAX(date) AS last_date
        FROM attendance
        WHERE worked = 1
        GROUP BY worker_id
    `
    );

    const map: Record<string, string> = {};
    for (const row of rows) {
        map[row.worker_id] = row.last_date;
    }
    return map;
}

async function ensureCurrentWeekRow(db: Awaited<ReturnType<typeof getDb>>): Promise<CurrentPayrollRow> {
    const { weekStart, weekEnd } = getCurrentWeekRangeIso();
    const expectedWeekId = `w-${weekStart}`;
    const { weekLabel, dateRange } = formatWeekLabelFromIsoRange(weekStart, weekEnd);

    const existing = await db.getFirstAsync<CurrentPayrollRow>(
        `
        SELECT week_id, week_label, date_range, pagada
        FROM payroll_weeks
        WHERE is_current = 1
        LIMIT 1
    `
    );
    if (existing?.week_id === expectedWeekId) return existing;

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE payroll_weeks
            SET
                is_current = 0,
                estado = CASE
                    WHEN pagada = 1 THEN 'pagada'
                    WHEN estado = 'en_curso' THEN 'archivada'
                    ELSE estado
                END
            WHERE is_current = 1
        `
        );

        const target = await db.getFirstAsync<CurrentPayrollRow>(
            `
            SELECT week_id, week_label, date_range, pagada
            FROM payroll_weeks
            WHERE week_id = ?
            LIMIT 1
        `,
            expectedWeekId
        );

        if (target) {
            await db.runAsync(
                `
                UPDATE payroll_weeks
                SET
                    is_current = 1,
                    week_label = ?,
                    date_range = ?,
                    estado = CASE
                        WHEN pagada = 1 THEN 'pagada'
                        ELSE 'en_curso'
                    END
                WHERE week_id = ?
            `,
                weekLabel,
                dateRange,
                expectedWeekId
            );
            return;
        }

        const minSort = await db.getFirstAsync<{ min_sort: number | null }>(
            `
            SELECT MIN(sort_order) AS min_sort
            FROM payroll_weeks
        `
        );
        const nextSort = typeof minSort?.min_sort === 'number' ? minSort.min_sort - 1 : 1;

        await db.runAsync(
            `
            INSERT INTO payroll_weeks (
                week_id, week_label, date_range, estado, pagada, total_amount, worker_count, is_current, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            expectedWeekId,
            weekLabel,
            dateRange,
            'en_curso',
            0,
            0,
            0,
            1,
            nextSort
        );
    });

    const current = await db.getFirstAsync<CurrentPayrollRow>(
        `
        SELECT week_id, week_label, date_range, pagada
        FROM payroll_weeks
        WHERE is_current = 1
        LIMIT 1
    `
    );

    if (current) return current;

    return {
        week_id: expectedWeekId,
        week_label: weekLabel,
        date_range: dateRange,
        pagada: 0,
    };
}

export async function fetchPayrollByWeekId(weekId: string): Promise<WeekPayroll> {
    if (!weekId) return emptyPayroll();
    const db = await getDb();
    const week = await db.getFirstAsync<CurrentPayrollRow>(
        `
        SELECT week_id, week_label, date_range, pagada
        FROM payroll_weeks
        WHERE week_id = ?
        LIMIT 1
    `,
        weekId
    );

    if (!week) return emptyPayroll();

    const rows = await db.getAllAsync<PayrollEntryRow>(
        `
        SELECT
            w.id AS worker_id,
            w.apodo,
            w.rol,
            w.iniciales,
            w.avatar_color_index,
            pe.dias_trabajados,
            pe.tarifa,
            pe.extras,
            pe.adelantos
        FROM payroll_entries pe
        INNER JOIN workers w
            ON w.id = pe.worker_id
        WHERE pe.week_id = ?
        ORDER BY w.apodo COLLATE NOCASE ASC
    `,
        weekId
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
    }).filter(shouldIncludePayrollEntry);

    const totalSemanal = entries.reduce((acc, item) => acc + item.totalPagar, 0);

    return {
        weekId: week.week_id,
        weekLabel: week.week_label,
        dateRange: week.date_range,
        pagada: boolFromInt(week.pagada),
        totalSemanal,
        workers: entries,
    };
}

export async function fetchWorkerPayrollHistory(workerId: string): Promise<WorkerPayrollHistoryEntry[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkerPayrollHistoryRow>(
        `
        SELECT
            pw.week_id,
            pw.week_label,
            pw.date_range,
            pw.estado,
            pw.pagada,
            pe.dias_trabajados,
            pe.tarifa,
            pe.extras,
            pe.adelantos
        FROM payroll_entries pe
        INNER JOIN payroll_weeks pw
            ON pw.week_id = pe.week_id
        WHERE pe.worker_id = ?
        ORDER BY pw.sort_order ASC
    `,
        workerId
    );

    const history = rows.map((row) => {
        const diasTrabajados = Number(row.dias_trabajados);
        const tarifa = Number(row.tarifa);
        const extras = Number(row.extras);
        const adelantos = Number(row.adelantos);

        return {
            weekId: row.week_id,
            weekLabel: row.week_label,
            dateRange: row.date_range,
            estado: row.estado,
            pagada: boolFromInt(row.pagada),
            diasTrabajados,
            tarifa,
            extras,
            adelantos,
            totalPagar: diasTrabajados * tarifa + extras - adelantos,
        };
    });

    // Ensure current week reflects the same dynamic calculations used in payroll screen.
    const currentPayroll = await fetchCurrentPayroll();
    const currentEntry = currentPayroll.workers.find((entry) => entry.workerId === workerId);
    if (!currentEntry) return history;

    const currentHistoryRow: WorkerPayrollHistoryEntry = {
        weekId: currentPayroll.weekId,
        weekLabel: currentPayroll.weekLabel,
        dateRange: currentPayroll.dateRange,
        estado: currentPayroll.pagada ? 'pagada' : 'en_curso',
        pagada: currentPayroll.pagada,
        diasTrabajados: currentEntry.diasTrabajados,
        tarifa: currentEntry.tarifa,
        extras: currentEntry.extras,
        adelantos: currentEntry.adelantos,
        totalPagar: currentEntry.totalPagar,
    };

    const currentIndex = history.findIndex((item) => item.weekId === currentPayroll.weekId);
    if (currentIndex >= 0) {
        history[currentIndex] = currentHistoryRow;
        return history;
    }

    return [currentHistoryRow, ...history];
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
    await toggleAttendanceForDate(workerId, todayKey());
}

export async function toggleAttendanceForDate(workerId: string, date: string): Promise<void> {
    const db = await getDb();
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
        INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota, extra_tipo)
        VALUES (?, ?, ?, NULL, NULL, 'general')
        ON CONFLICT(worker_id, date) DO UPDATE SET
            worked = excluded.worked,
            extra_monto = CASE
                WHEN excluded.worked = 0 THEN NULL
                WHEN attendance.worked = 0 AND attendance.extra_tipo = 'medio_dia' THEN NULL
                ELSE extra_monto
            END,
            extra_nota = CASE
                WHEN excluded.worked = 0 THEN NULL
                WHEN attendance.worked = 0 AND attendance.extra_tipo = 'medio_dia' THEN NULL
                ELSE extra_nota
            END,
            extra_tipo = CASE
                WHEN excluded.worked = 0 THEN 'general'
                WHEN attendance.worked = 0 AND attendance.extra_tipo = 'medio_dia' THEN 'general'
                ELSE extra_tipo
            END
    `,
        workerId,
        date,
        nextWorked
    );
}

export async function setExtraForToday(workerId: string, extra: ExtraPayment | undefined): Promise<void> {
    await setExtraForDate(workerId, todayKey(), extra);
}

export async function setExtraForDate(workerId: string, date: string, extra: ExtraPayment | undefined): Promise<void> {
    const db = await getDb();
    const current = await db.getFirstAsync<{ worked: number }>(
        `
        SELECT worked
        FROM attendance
        WHERE worker_id = ? AND date = ?
    `,
        workerId,
        date
    );

    if (!current && !extra) return;

    const worked = current?.worked ?? 0;
    const monto = extra?.monto ?? null;
    const nota = extra?.nota ?? null;
    const tipo: ExtraPayment['tipo'] = extra?.tipo === 'medio_dia' ? 'medio_dia' : 'general';

    await db.runAsync(
        `
        INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota, extra_tipo)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(worker_id, date) DO UPDATE SET
            extra_monto = excluded.extra_monto,
            extra_nota = excluded.extra_nota,
            extra_tipo = excluded.extra_tipo
    `,
        workerId,
        date,
        worked,
        monto,
        nota,
        tipo
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
            id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, saldo_pendiente, nota, fecha_iso, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        createAdvanceId(),
        input.workerId,
        input.workerApodo,
        input.workerIniciales,
        input.avatarColorIndex,
        input.monto,
        input.monto,
        input.nota,
        new Date().toISOString(),
        'pendiente'
    );
}

export async function clearCurrentWeekAdvanceOverride(workerId: string): Promise<void> {
    if (!workerId) return;
    const db = await getDb();
    const weekId = await getCurrentWeekId(db);
    if (!weekId) return;

    await db.runAsync(
        `
        UPDATE payroll_entries
        SET adelantos_override = 0
        WHERE week_id = ? AND worker_id = ?
    `,
        weekId,
        workerId
    );
}

export async function cancelAdvanceRecord(advanceId: string): Promise<boolean> {
    if (!advanceId) return false;
    const db = await getDb();
    const advance = await db.getFirstAsync<{ estado: Advance['estado'] }>(
        `
        SELECT estado
        FROM advances
        WHERE id = ?
        LIMIT 1
    `,
        advanceId
    );

    if (!advance) return false;
    if (advance.estado === 'descontado') return false;

    await db.runAsync(
        `
        DELETE FROM advances
        WHERE id = ?
    `,
        advanceId
    );
    return true;
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
                0,
                worker.tarifa,
                0,
                0
            );
        }
    });
}

export async function activateWorkerForCurrentWeek(workerId: string): Promise<void> {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
        const worker = await db.getFirstAsync<{ tarifa: number }>(
            `
            SELECT tarifa
            FROM workers
            WHERE id = ?
            LIMIT 1
        `,
            workerId
        );

        if (!worker) return;

        await db.runAsync(
            `
            UPDATE workers
            SET activo = 1
            WHERE id = ?
        `,
            workerId
        );

        const weekId = await getCurrentWeekId(db);
        if (!weekId) return;

        await db.runAsync(
            `
            INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(week_id, worker_id) DO NOTHING
        `,
            `${weekId}-${workerId}`,
            weekId,
            workerId,
            0,
            Number(worker.tarifa),
            0,
            0
        );
    });
}

export async function deactivateWorkerRecord(workerId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `
        UPDATE workers
        SET activo = 0
        WHERE id = ?
    `,
        workerId
    );
}

export async function updateWorkerRecord(input: {
    id: string;
    apodo: string;
    nombreCompleto: string;
    tarifa: number;
    tipo: Worker['tipo'];
    iniciales: string;
}): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE workers
            SET
                apodo = ?,
                nombre_completo = ?,
                tarifa = ?,
                tipo = ?,
                iniciales = ?
            WHERE id = ?
        `,
            input.apodo,
            input.nombreCompleto,
            input.tarifa,
            input.tipo,
            input.iniciales,
            input.id
        );

        const weekId = await getCurrentWeekId(db);
        if (!weekId) return;

        await db.runAsync(
            `
            UPDATE payroll_entries
            SET tarifa = ?
            WHERE week_id = ? AND worker_id = ?
        `,
            input.tarifa,
            weekId,
            input.id
        );
    });
}

export async function setCurrentWeekPayrollAdjustment(workerId: string, extras: number, adelantos: number): Promise<void> {
    const db = await getDb();
    const weekId = await getCurrentWeekId(db);
    if (!weekId) return;
    const { weekStart, weekEnd } = getCurrentWeekRangeIso();

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

    const attendanceSummary = await db.getFirstAsync<{ extras: number }>(
        `
        SELECT
            COALESCE(SUM(CASE WHEN worked = 1 THEN COALESCE(extra_monto, 0) ELSE 0 END), 0) AS extras
        FROM attendance
        WHERE worker_id = ? AND date >= ? AND date <= ?
    `,
        workerId,
        weekStart,
        weekEnd
    );

    const pendingDebt = await db.getFirstAsync<{ total: number }>(
        `
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN estado = 'descontado' THEN 0
                        ELSE COALESCE(saldo_pendiente, monto, 0)
                    END
                ),
                0
            ) AS total
        FROM advances
        WHERE worker_id = ?
    `,
        workerId
    );

    const dias = existing?.dias_trabajados ?? 0;
    const tarifa = existing?.tarifa ?? worker?.tarifa ?? 0;
    const attendanceExtras = Math.max(0, Number(attendanceSummary?.extras ?? 0));
    const extrasManual = Math.max(0, (extras || 0) - attendanceExtras);
    const deudaDisponible = Math.max(0, Number(pendingDebt?.total ?? 0));
    const adelantosAplicar = Math.min(Math.max(0, adelantos || 0), deudaDisponible);
    const adelantosOverride = Math.abs(adelantosAplicar - deudaDisponible) > 0.01 ? 1 : 0;

    await db.runAsync(
        `
        INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos, adelantos_override)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(week_id, worker_id) DO UPDATE SET
            extras = excluded.extras,
            adelantos = excluded.adelantos,
            adelantos_override = excluded.adelantos_override
    `,
        `${weekId}-${workerId}`,
        weekId,
        workerId,
        dias,
        tarifa,
        extrasManual,
        adelantosAplicar,
        adelantosOverride
    );
}

async function recalculateAdvancesFromPaidPayroll(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
    const deductedByWorker = await db.getAllAsync<{ worker_id: string; total_deducido: number }>(
        `
        SELECT pe.worker_id, COALESCE(SUM(pe.adelantos), 0) AS total_deducido
        FROM payroll_entries pe
        INNER JOIN payroll_weeks pw
            ON pw.week_id = pe.week_id
        WHERE pw.pagada = 1
        GROUP BY pe.worker_id
    `
    );

    const deductedMap = new Map<string, number>();
    for (const row of deductedByWorker) {
        deductedMap.set(row.worker_id, Math.max(0, Number(row.total_deducido)));
    }

    const advances = await db.getAllAsync<{ id: string; worker_id: string; monto: number }>(
        `
        SELECT id, worker_id, monto
        FROM advances
        ORDER BY worker_id ASC, fecha_iso ASC
    `
    );

    for (const advance of advances) {
        const workerId = advance.worker_id;
        const monto = Math.max(0, Number(advance.monto));
        const workerRemainingDeduction = Math.max(0, deductedMap.get(workerId) ?? 0);
        const applied = Math.min(workerRemainingDeduction, monto);
        const saldoPendiente = Math.max(0, monto - applied);
        const estado: Advance['estado'] =
            saldoPendiente <= 0
                ? 'descontado'
                : saldoPendiente < monto
                    ? 'parcial'
                    : 'pendiente';

        deductedMap.set(workerId, Math.max(0, workerRemainingDeduction - applied));

        await db.runAsync(
            `
            UPDATE advances
            SET saldo_pendiente = ?, estado = ?
            WHERE id = ?
        `,
            saldoPendiente,
            estado,
            advance.id
        );
    }
}

export async function markCurrentWeekAsPaid(): Promise<void> {
    const db = await getDb();
    const payroll = await fetchCurrentPayroll();
    const weekId = payroll.weekId;
    if (!weekId) return;

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            DELETE FROM payroll_entries
            WHERE week_id = ?
        `,
            weekId
        );

        for (const entry of payroll.workers) {
            await db.runAsync(
                `
                INSERT INTO payroll_entries (
                    id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos, adelantos_override
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(week_id, worker_id) DO UPDATE SET
                    dias_trabajados = excluded.dias_trabajados,
                    tarifa = excluded.tarifa,
                    extras = excluded.extras,
                    adelantos = excluded.adelantos,
                    adelantos_override = excluded.adelantos_override
            `,
                `${weekId}-${entry.workerId}`,
                weekId,
                entry.workerId,
                entry.diasTrabajados,
                entry.tarifa,
                entry.extras,
                entry.adelantos,
                1
            );
        }

        await db.runAsync(
            `
            UPDATE payroll_weeks
            SET pagada = 1, estado = 'pagada'
            WHERE is_current = 1
        `
        );

        await recalculateAdvancesFromPaidPayroll(db);
    });
}

export async function unmarkCurrentWeekAsPaid(): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `
            UPDATE payroll_weeks
            SET pagada = 0, estado = 'en_curso'
            WHERE is_current = 1
        `
        );

        await recalculateAdvancesFromPaidPayroll(db);
    });
}

