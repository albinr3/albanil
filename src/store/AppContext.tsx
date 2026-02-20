import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
    Worker,
    AttendanceRecord,
    Advance,
    WeekPayroll,
    ExtraPayment,
    WeekHistoryEntry,
} from './types';
import { bootstrapDatabase } from '../db/bootstrap';
import { showToast } from '../ui/toast';
import {
    activateWorkerForCurrentWeek,
    addAdvanceRecord,
    addWorkerRecord,
    deactivateWorkerRecord,
    fetchAdvances,
    fetchCurrentPayroll,
    fetchAttendanceByDate,
    fetchTodayAttendance,
    fetchWeekHistory,
    fetchWorkers,
    loadAppSnapshot,
    markCurrentWeekAsPaid,
    payrollToAdjustments,
    setCurrentWeekPayrollAdjustment,
    setExtraForToday,
    setExtraForDate,
    toggleAttendanceForToday,
    toggleAttendanceForDate,
    updateWorkerRecord,
} from '../db/repository';

interface AppState {
    workers: Worker[];
    attendance: Record<string, AttendanceRecord>;
    advances: Advance[];
    weekPagada: boolean;
    weekHistory: WeekHistoryEntry[];
    payrollAdjustments: Record<string, { extras: number; adelantos: number }>;

    toggleAttendance: (workerId: string) => void;
    toggleAttendanceByDate: (workerId: string, date: string) => void;
    setExtra: (workerId: string, extra: ExtraPayment | undefined) => void;
    setExtraByDate: (workerId: string, date: string, extra: ExtraPayment | undefined) => void;
    addAdvance: (workerId: string, monto: number, nota: string) => void;
    addWorker: (input: {
        apodo: string;
        nombreCompleto?: string;
        tarifa: number;
        tipo: Worker['tipo'];
    }) => void;
    addWorkerToWeek: (workerId: string) => void;
    deactivateWorker: (workerId: string) => void;
    updateWorker: (input: {
        id: string;
        apodo: string;
        nombreCompleto?: string;
        tarifa: number;
        tipo: Worker['tipo'];
    }) => void;
    setPayrollAdjustment: (workerId: string, extras: number, adelantos: number) => void;
    markWeekPaid: () => void;
    getAttendance: (workerId: string) => AttendanceRecord;
    getAttendanceByDate: (workerId: string, date: string) => AttendanceRecord;
    getPayroll: () => WeekPayroll;
}

const EMPTY_PAYROLL: WeekPayroll = {
    weekId: 'w-current',
    weekLabel: 'Semana Actual',
    dateRange: '--',
    pagada: false,
    totalSemanal: 0,
    workers: [],
};

const AppContext = createContext<AppState | null>(null);

function todayKey(): string {
    return new Date().toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [isDbReady, setIsDbReady] = useState(false);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [advances, setAdvances] = useState<Advance[]>([]);
    const [weekPagada, setWeekPagada] = useState(false);
    const [weekHistory, setWeekHistory] = useState<WeekHistoryEntry[]>([]);
    const [payrollAdjustments, setPayrollAdjustments] = useState<Record<string, { extras: number; adelantos: number }>>({});
    const [payroll, setPayroll] = useState<WeekPayroll>(EMPTY_PAYROLL);

    useEffect(() => {
        let isActive = true;

        void (async () => {
            try {
                await bootstrapDatabase();
                const snapshot = await loadAppSnapshot();
                if (!isActive) return;

                setWorkers(snapshot.workers);
                setAttendance(snapshot.attendance);
                setAdvances(snapshot.advances);
                setWeekHistory(snapshot.weekHistory);
                setPayroll(snapshot.payroll);
                setPayrollAdjustments(snapshot.payrollAdjustments);
                setWeekPagada(snapshot.weekPagada);
                setIsDbReady(true);
            } catch (error) {
                console.error('[store] failed to initialize database', error);
                if (isActive) {
                    setIsDbReady(true);
                }
            }
        })();

        return () => {
            isActive = false;
        };
    }, []);

    const getAttendance = useCallback(
        (workerId: string): AttendanceRecord => {
            const date = todayKey();
            const key = `${workerId}-${date}`;
            return attendance[key] || { workerId, date, worked: false };
        },
        [attendance]
    );

    const toggleAttendance = useCallback(
        (workerId: string) => {
            if (!isDbReady) return;
            void (async () => {
                try {
                    await toggleAttendanceForToday(workerId);
                    const nextAttendance = await fetchTodayAttendance();
                    setAttendance(nextAttendance);
                    const worked = nextAttendance[`${workerId}-${todayKey()}`]?.worked ?? false;
                    showToast({
                        type: 'success',
                        title: worked ? 'Asistencia marcada' : 'Asistencia removida',
                        message: worked ? 'El trabajador fue marcado como presente.' : 'El trabajador fue marcado como ausente.',
                    });
                } catch (error) {
                    console.error('[store] toggleAttendance failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo actualizar la asistencia.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const toggleAttendanceByDate = useCallback(
        (workerId: string, date: string) => {
            if (!isDbReady) return;
            if (!date) return;
            void (async () => {
                try {
                    await toggleAttendanceForDate(workerId, date);
                    if (date === todayKey()) {
                        const nextAttendance = await fetchTodayAttendance();
                        setAttendance(nextAttendance);
                    }
                    showToast({
                        type: 'success',
                        title: 'Asistencia actualizada',
                        message: 'La asistencia del dia fue actualizada.',
                    });
                } catch (error) {
                    console.error('[store] toggleAttendanceByDate failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo actualizar la asistencia.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const setExtra = useCallback(
        (workerId: string, extra: ExtraPayment | undefined) => {
            if (!isDbReady) return;
            void (async () => {
                try {
                    await setExtraForToday(workerId, extra);
                    const nextAttendance = await fetchTodayAttendance();
                    setAttendance(nextAttendance);
                    showToast({
                        type: 'success',
                        title: 'Extra guardado',
                        message: extra ? 'Pago extra registrado correctamente.' : 'Pago extra removido correctamente.',
                    });
                } catch (error) {
                    console.error('[store] setExtra failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo guardar el pago extra.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const setExtraByDate = useCallback(
        (workerId: string, date: string, extra: ExtraPayment | undefined) => {
            if (!isDbReady) return;
            if (!date) return;
            void (async () => {
                try {
                    await setExtraForDate(workerId, date, extra);
                    if (date === todayKey()) {
                        const nextAttendance = await fetchTodayAttendance();
                        setAttendance(nextAttendance);
                    }
                    showToast({
                        type: 'success',
                        title: 'Extra guardado',
                        message: 'El pago extra del dia fue actualizado.',
                    });
                } catch (error) {
                    console.error('[store] setExtraByDate failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo guardar el pago extra.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const addAdvance = useCallback(
        (workerId: string, monto: number, nota: string) => {
            if (!isDbReady) return;
            if (!Number.isFinite(monto) || monto <= 0) return;

            const worker = workers.find((w) => w.id === workerId);
            if (!worker) return;

            void (async () => {
                try {
                    await addAdvanceRecord({
                        workerId,
                        workerApodo: worker.apodo,
                        workerIniciales: worker.iniciales,
                        avatarColorIndex: worker.avatarColorIndex,
                        monto,
                        nota,
                    });
                    const nextAdvances = await fetchAdvances();
                    setAdvances(nextAdvances);
                    showToast({
                        type: 'success',
                        title: 'Adelanto registrado',
                        message: 'El adelanto fue guardado correctamente.',
                    });
                } catch (error) {
                    console.error('[store] addAdvance failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo registrar el adelanto.',
                    });
                }
            })();
        },
        [isDbReady, workers]
    );

    const addWorker = useCallback(
        (input: {
            apodo: string;
            nombreCompleto?: string;
            tarifa: number;
            tipo: Worker['tipo'];
        }) => {
            if (!isDbReady) return;
            const normalizedApodo = input.apodo.trim();
            if (!normalizedApodo) return;
            if (!Number.isFinite(input.tarifa) || input.tarifa <= 0) return;

            const fullName = (input.nombreCompleto ?? '').trim();
            const initialsSource = fullName || normalizedApodo;
            const initials =
                initialsSource
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase() ?? '')
                    .join('') || normalizedApodo.slice(0, 2).toUpperCase();

            const worker: Worker = {
                id: `w-${Date.now()}`,
                apodo: normalizedApodo,
                nombreCompleto: fullName,
                tarifa: input.tarifa,
                tipo: input.tipo,
                rol: 'ayudante',
                activo: true,
                iniciales: initials,
                avatarColorIndex: Math.floor(Math.random() * 5),
            };

            void (async () => {
                try {
                    await addWorkerRecord(worker);
                    const [nextWorkers, nextPayroll] = await Promise.all([
                        fetchWorkers(),
                        fetchCurrentPayroll(),
                    ]);
                    setWorkers(nextWorkers);
                    setPayroll(nextPayroll);
                    setPayrollAdjustments(payrollToAdjustments(nextPayroll));
                    setWeekPagada(nextPayroll.pagada);
                    showToast({
                        type: 'success',
                        title: 'Trabajador creado',
                        message: `${worker.apodo} fue agregado correctamente.`,
                    });
                } catch (error) {
                    console.error('[store] addWorker failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo crear el trabajador.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const setPayrollAdjustment = useCallback(
        (workerId: string, extras: number, adelantos: number) => {
            if (!isDbReady) return;
            void (async () => {
                try {
                    await setCurrentWeekPayrollAdjustment(workerId, extras, adelantos);
                    const nextPayroll = await fetchCurrentPayroll();
                    setPayroll(nextPayroll);
                    setPayrollAdjustments(payrollToAdjustments(nextPayroll));
                    setWeekPagada(nextPayroll.pagada);
                    showToast({
                        type: 'success',
                        title: 'Ajustes guardados',
                        message: 'Los ajustes de nomina fueron actualizados.',
                    });
                } catch (error) {
                    console.error('[store] setPayrollAdjustment failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudieron guardar los ajustes.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const addWorkerToWeek = useCallback(
        (workerId: string) => {
            if (!isDbReady) return;
            if (!workerId) return;

            void (async () => {
                try {
                    await activateWorkerForCurrentWeek(workerId);
                    const [nextWorkers, nextPayroll] = await Promise.all([
                        fetchWorkers(),
                        fetchCurrentPayroll(),
                    ]);
                    setWorkers(nextWorkers);
                    setPayroll(nextPayroll);
                    setPayrollAdjustments(payrollToAdjustments(nextPayroll));
                    setWeekPagada(nextPayroll.pagada);
                    const worker = nextWorkers.find((w) => w.id === workerId);
                    showToast({
                        type: 'success',
                        title: 'Trabajador agregado',
                        message: worker ? `${worker.apodo} fue agregado a la semana actual.` : 'Trabajador agregado a la semana actual.',
                    });
                } catch (error) {
                    console.error('[store] addWorkerToWeek failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo agregar el trabajador a la semana.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const deactivateWorker = useCallback(
        (workerId: string) => {
            if (!isDbReady) return;
            if (!workerId) return;

            void (async () => {
                try {
                    await deactivateWorkerRecord(workerId);
                    const [nextWorkers, nextPayroll] = await Promise.all([
                        fetchWorkers(),
                        fetchCurrentPayroll(),
                    ]);
                    setWorkers(nextWorkers);
                    setPayroll(nextPayroll);
                    setPayrollAdjustments(payrollToAdjustments(nextPayroll));
                    setWeekPagada(nextPayroll.pagada);
                    showToast({
                        type: 'info',
                        title: 'Trabajador desactivado',
                        message: 'El trabajador fue desactivado correctamente.',
                    });
                } catch (error) {
                    console.error('[store] deactivateWorker failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo desactivar el trabajador.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const updateWorker = useCallback(
        (input: {
            id: string;
            apodo: string;
            nombreCompleto?: string;
            tarifa: number;
            tipo: Worker['tipo'];
        }) => {
            if (!isDbReady) return;
            const workerId = input.id?.trim();
            const normalizedApodo = input.apodo.trim();
            if (!workerId || !normalizedApodo) return;
            if (!Number.isFinite(input.tarifa) || input.tarifa <= 0) return;

            const fullName = (input.nombreCompleto ?? '').trim();
            const initialsSource = fullName || normalizedApodo;
            const initials =
                initialsSource
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase() ?? '')
                    .join('') || normalizedApodo.slice(0, 2).toUpperCase();

            void (async () => {
                try {
                    await updateWorkerRecord({
                        id: workerId,
                        apodo: normalizedApodo,
                        nombreCompleto: fullName,
                        tarifa: input.tarifa,
                        tipo: input.tipo,
                        iniciales: initials,
                    });
                    const [nextWorkers, nextPayroll] = await Promise.all([
                        fetchWorkers(),
                        fetchCurrentPayroll(),
                    ]);
                    setWorkers(nextWorkers);
                    setPayroll(nextPayroll);
                    setPayrollAdjustments(payrollToAdjustments(nextPayroll));
                    setWeekPagada(nextPayroll.pagada);
                    showToast({
                        type: 'success',
                        title: 'Trabajador actualizado',
                        message: 'Los datos del trabajador se guardaron.',
                    });
                } catch (error) {
                    console.error('[store] updateWorker failed', error);
                    showToast({
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo actualizar el trabajador.',
                    });
                }
            })();
        },
        [isDbReady]
    );

    const markWeekPaid = useCallback(() => {
        if (!isDbReady) return;
        void (async () => {
            try {
                await markCurrentWeekAsPaid();
                const [nextPayroll, nextHistory] = await Promise.all([
                    fetchCurrentPayroll(),
                    fetchWeekHistory(),
                ]);
                setPayroll(nextPayroll);
                setWeekPagada(nextPayroll.pagada);
                setPayrollAdjustments(payrollToAdjustments(nextPayroll));
                setWeekHistory(nextHistory);
                showToast({
                    type: 'success',
                    title: 'Semana pagada',
                    message: 'La semana actual fue marcada como pagada.',
                });
            } catch (error) {
                console.error('[store] markWeekPaid failed', error);
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo marcar la semana como pagada.',
                });
            }
        })();
    }, [isDbReady]);

    const getPayroll = useCallback((): WeekPayroll => payroll, [payroll]);

    const getAttendanceByDate = useCallback(
        (workerId: string, date: string): AttendanceRecord => {
            const key = `${workerId}-${date}`;
            const existing = attendance[key];
            if (existing) return existing;
            return { workerId, date, worked: false };
        },
        [attendance]
    );

    const value = useMemo(
        () => ({
            workers,
            attendance,
            advances,
            weekPagada,
            weekHistory,
            payrollAdjustments,
            toggleAttendance,
            toggleAttendanceByDate,
            setExtra,
            setExtraByDate,
            addAdvance,
            addWorker,
            addWorkerToWeek,
            deactivateWorker,
            updateWorker,
            setPayrollAdjustment,
            markWeekPaid,
            getAttendance,
            getAttendanceByDate,
            getPayroll,
        }),
        [
            workers,
            attendance,
            advances,
            weekPagada,
            weekHistory,
            payrollAdjustments,
            toggleAttendance,
            toggleAttendanceByDate,
            setExtra,
            setExtraByDate,
            addAdvance,
            addWorker,
            addWorkerToWeek,
            deactivateWorker,
            updateWorker,
            setPayrollAdjustment,
            markWeekPaid,
            getAttendance,
            getAttendanceByDate,
            getPayroll,
        ]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppState {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppStore must be used within AppProvider');
    return ctx;
}
