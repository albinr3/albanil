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
import {
    addAdvanceRecord,
    addWorkerRecord,
    fetchAdvances,
    fetchCurrentPayroll,
    fetchTodayAttendance,
    fetchWeekHistory,
    fetchWorkers,
    loadAppSnapshot,
    markCurrentWeekAsPaid,
    payrollToAdjustments,
    setCurrentWeekPayrollAdjustment,
    setExtraForToday,
    toggleAttendanceForToday,
} from '../db/repository';

interface AppState {
    workers: Worker[];
    attendance: Record<string, AttendanceRecord>;
    advances: Advance[];
    weekPagada: boolean;
    weekHistory: WeekHistoryEntry[];
    payrollAdjustments: Record<string, { extras: number; adelantos: number }>;

    toggleAttendance: (workerId: string) => void;
    setExtra: (workerId: string, extra: ExtraPayment | undefined) => void;
    addAdvance: (workerId: string, monto: number, nota: string) => void;
    addWorker: (input: {
        apodo: string;
        nombreCompleto?: string;
        tarifa: number;
        tipo: Worker['tipo'];
    }) => void;
    setPayrollAdjustment: (workerId: string, extras: number, adelantos: number) => void;
    markWeekPaid: () => void;
    getAttendance: (workerId: string) => AttendanceRecord;
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
                } catch (error) {
                    console.error('[store] toggleAttendance failed', error);
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
                } catch (error) {
                    console.error('[store] setExtra failed', error);
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
                } catch (error) {
                    console.error('[store] addAdvance failed', error);
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
                } catch (error) {
                    console.error('[store] addWorker failed', error);
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
                } catch (error) {
                    console.error('[store] setPayrollAdjustment failed', error);
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
            } catch (error) {
                console.error('[store] markWeekPaid failed', error);
            }
        })();
    }, [isDbReady]);

    const getPayroll = useCallback((): WeekPayroll => payroll, [payroll]);

    const value = useMemo(
        () => ({
            workers,
            attendance,
            advances,
            weekPagada,
            weekHistory,
            payrollAdjustments,
            toggleAttendance,
            setExtra,
            addAdvance,
            addWorker,
            setPayrollAdjustment,
            markWeekPaid,
            getAttendance,
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
            setExtra,
            addAdvance,
            addWorker,
            setPayrollAdjustment,
            markWeekPaid,
            getAttendance,
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
