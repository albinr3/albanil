export type TipoTrabajador = 'fijo' | 'por_dias';
export type RolTrabajador = 'albañil' | 'ayudante' | 'carpintero' | 'pintor' | 'varillero' | 'maestro';
export type EstadoAdelanto = 'pendiente' | 'parcial' | 'descontado';

export interface Worker {
    id: string;
    apodo: string;
    nombreCompleto: string;
    tarifa: number;
    tipo: TipoTrabajador;
    rol: RolTrabajador;
    activo: boolean;
    iniciales: string;
    avatarColorIndex: number;
}

export interface ExtraPayment {
    monto: number;
    nota: string;
}

export interface AttendanceRecord {
    workerId: string;
    date: string; // ISO date string YYYY-MM-DD
    worked: boolean;
    extra?: ExtraPayment;
}

export interface Advance {
    id: string;
    workerId: string;
    workerApodo: string;
    workerIniciales: string;
    monto: number;
    saldoPendiente: number;
    nota: string;
    fecha: Date;
    estado: EstadoAdelanto;
    avatarColorIndex: number;
}

export interface PayrollWorkerEntry {
    workerId: string;
    apodo: string;
    rol: RolTrabajador;
    iniciales: string;
    avatarColorIndex: number;
    diasTrabajados: number;
    tarifa: number;
    totalDias: number;
    extras: number;
    adelantos: number;
    totalPagar: number;
}

export interface WeekPayroll {
    weekId: string;
    weekLabel: string;
    dateRange: string;
    pagada: boolean;
    totalSemanal: number;
    workers: PayrollWorkerEntry[];
}

export interface WeekHistoryEntry {
    weekId: string;
    weekLabel: string;
    dateRange: string;
    totalAmount: number;
    workerCount: number;
    estado: 'pagada' | 'archivada' | 'en_curso';
}
