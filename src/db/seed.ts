import type { SQLiteDatabase } from 'expo-sqlite';
import type { Worker } from '../store/types';

const WORKERS: Worker[] = [
    {
        id: '1',
        apodo: 'El Flaco',
        nombreCompleto: 'Juan Antonio Perez',
        tarifa: 1500,
        tipo: 'fijo',
        rol: 'maestro',
        activo: true,
        iniciales: 'EF',
        avatarColorIndex: 0,
    },
    {
        id: '2',
        apodo: 'Moreno',
        nombreCompleto: 'Pedro Rodriguez',
        tarifa: 1200,
        tipo: 'por_dias',
        rol: 'albañil',
        activo: true,
        iniciales: 'M',
        avatarColorIndex: 1,
    },
    {
        id: '3',
        apodo: 'Juan "El Lento"',
        nombreCompleto: 'Juan Manuel Santos',
        tarifa: 1200,
        tipo: 'por_dias',
        rol: 'ayudante',
        activo: true,
        iniciales: 'JL',
        avatarColorIndex: 2,
    },
    {
        id: '4',
        apodo: 'Miguelito',
        nombreCompleto: 'Miguel Angel Torres',
        tarifa: 1000,
        tipo: 'por_dias',
        rol: 'ayudante',
        activo: true,
        iniciales: 'MT',
        avatarColorIndex: 3,
    },
    {
        id: '5',
        apodo: 'Maestro Rubio',
        nombreCompleto: 'Carlos Rubio Mendez',
        tarifa: 2500,
        tipo: 'fijo',
        rol: 'maestro',
        activo: true,
        iniciales: 'MR',
        avatarColorIndex: 4,
    },
    {
        id: '6',
        apodo: 'Luis Pintor',
        nombreCompleto: 'Luis Alberto Pineda',
        tarifa: 1800,
        tipo: 'por_dias',
        rol: 'pintor',
        activo: false,
        iniciales: 'LP',
        avatarColorIndex: 0,
    },
];

function todayKey(): string {
    return new Date().toISOString().split('T')[0];
}

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 86400000).toISOString();
}

export async function seedDatabaseIfEmpty(db: SQLiteDatabase): Promise<boolean> {
    const existing = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM workers'
    );
    if ((existing?.count ?? 0) > 0) {
        return false;
    }

    const today = todayKey();

    await db.withTransactionAsync(async () => {
        for (const worker of WORKERS) {
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
        }

        await db.runAsync(
            `
            INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
            VALUES (?, ?, 1, NULL, NULL)
        `,
            '1',
            today
        );
        await db.runAsync(
            `
            INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
            VALUES (?, ?, 0, NULL, NULL)
        `,
            '2',
            today
        );
        await db.runAsync(
            `
            INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
            VALUES (?, ?, 1, ?, ?)
        `,
            '3',
            today,
            200,
            'Cena'
        );
        await db.runAsync(
            `
            INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
            VALUES (?, ?, 1, NULL, NULL)
        `,
            '4',
            today
        );
        await db.runAsync(
            `
            INSERT INTO attendance (worker_id, date, worked, extra_monto, extra_nota)
            VALUES (?, ?, 1, NULL, NULL)
        `,
            '5',
            today
        );

        await db.runAsync(
            `
            INSERT INTO advances (
                id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, nota, fecha_iso, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'a1',
            '3',
            'Jose "Varilla"',
            'JM',
            0,
            2000,
            '',
            daysAgo(0),
            'pendiente'
        );
        await db.runAsync(
            `
            INSERT INTO advances (
                id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, nota, fecha_iso, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'a2',
            '1',
            'Pedro "El Flaco"',
            'PF',
            1,
            500,
            'Comida',
            daysAgo(1),
            'parcial'
        );
        await db.runAsync(
            `
            INSERT INTO advances (
                id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, nota, fecha_iso, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'a3',
            '4',
            'Miguel Santos',
            'MS',
            3,
            1500,
            '',
            daysAgo(5),
            'descontado'
        );
        await db.runAsync(
            `
            INSERT INTO advances (
                id, worker_id, worker_apodo, worker_iniciales, avatar_color_index, monto, nota, fecha_iso, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'a4',
            '3',
            'Luis "Carpintero"',
            'LC',
            4,
            3000,
            'Pasaje',
            daysAgo(6),
            'pendiente'
        );

        await db.runAsync(
            `
            INSERT INTO payroll_weeks (
                week_id, week_label, date_range, estado, pagada, total_amount, worker_count, is_current, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'w1',
            'Semana 16-21 Feb',
            '16-21 Feb',
            'en_curso',
            0,
            145000,
            15,
            1,
            1
        );
        await db.runAsync(
            `
            INSERT INTO payroll_weeks (
                week_id, week_label, date_range, estado, pagada, total_amount, worker_count, is_current, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'w2',
            'Semana 9-14 Feb',
            '9-14 Feb',
            'pagada',
            1,
            138500,
            8,
            0,
            2
        );
        await db.runAsync(
            `
            INSERT INTO payroll_weeks (
                week_id, week_label, date_range, estado, pagada, total_amount, worker_count, is_current, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'w3',
            'Semana 2-7 Feb',
            '2-7 Feb',
            'pagada',
            1,
            152000,
            15,
            0,
            3
        );
        await db.runAsync(
            `
            INSERT INTO payroll_weeks (
                week_id, week_label, date_range, estado, pagada, total_amount, worker_count, is_current, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            'w4',
            'Semana 26-31 Ene',
            '26-31 Ene',
            'archivada',
            0,
            141200,
            14,
            0,
            4
        );

        await db.runAsync(
            `
            INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            'w1-1',
            'w1',
            '1',
            5,
            1500,
            200,
            500
        );
        await db.runAsync(
            `
            INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            'w1-2',
            'w1',
            '2',
            5,
            1200,
            500,
            1000
        );
        await db.runAsync(
            `
            INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            'w1-3',
            'w1',
            '3',
            4.5,
            1200,
            0,
            0
        );
        await db.runAsync(
            `
            INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            'w1-4',
            'w1',
            '4',
            5,
            1000,
            0,
            0
        );
        await db.runAsync(
            `
            INSERT INTO payroll_entries (id, week_id, worker_id, dias_trabajados, tarifa, extras, adelantos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            'w1-5',
            'w1',
            '5',
            5,
            2500,
            0,
            0
        );
    });

    return true;
}
