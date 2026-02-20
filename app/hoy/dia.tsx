import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { fetchAttendanceByDate } from '../../src/db/repository';
import type { AttendanceRecord, Worker } from '../../src/store/types';
import { BorderRadius, Colors, Shadows, Spacing } from '../../src/theme';
import { formatMoney } from '../../src/utils';

function toReadableDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('es-DO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function getWorkerIdsFromAttendance(attendance: Record<string, AttendanceRecord>, date: string): string[] {
    return Object.keys(attendance)
        .filter((key) => key.endsWith(`-${date}`))
        .map((key) => key.slice(0, -(date.length + 1)));
}

function buildWorkersForDate(workers: Worker[], attendance: Record<string, AttendanceRecord>, date: string): Worker[] {
    const withAttendance = new Set(getWorkerIdsFromAttendance(attendance, date));
    const filtered = workers.filter((w) => w.activo || withAttendance.has(w.id));
    return filtered.sort((a, b) => a.apodo.localeCompare(b.apodo, 'es'));
}

export default function DiaDetalleScreen() {
    const router = useRouter();
    const { date } = useLocalSearchParams<{ date: string }>();
    const { workers } = useAppStore();
    const [attendanceByDate, setAttendanceByDate] = useState<Record<string, AttendanceRecord>>({});

    useEffect(() => {
        if (!date) return;
        let active = true;
        void (async () => {
            const rows = await fetchAttendanceByDate(date);
            if (active) setAttendanceByDate(rows);
        })();
        return () => {
            active = false;
        };
    }, [date]);

    useFocusEffect(
        React.useCallback(() => {
            if (!date) return;
            void (async () => {
                const rows = await fetchAttendanceByDate(date);
                setAttendanceByDate(rows);
            })();
        }, [date])
    );

    const dayWorkers = useMemo(() => {
        if (!date) return [];
        return buildWorkersForDate(workers, attendanceByDate, date);
    }, [workers, attendanceByDate, date]);

    const rows = dayWorkers.map((worker) => {
        const key = `${worker.id}-${date}`;
        const attendance = attendanceByDate[key] || { workerId: worker.id, date: date || '', worked: false };
        return { worker, attendance };
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color={Colors.slate700} />
                </TouchableOpacity>
                <Text style={styles.title}>Detalle del día</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.dateTitle}>{date ? toReadableDate(date) : ''}</Text>
                <Text style={styles.readOnlyBadge}>Solo lectura</Text>

                <View style={styles.list}>
                    {rows.map(({ worker, attendance }) => (
                        <View key={worker.id} style={[styles.card, Shadows.card]}>
                            <View style={styles.cardTop}>
                                <View>
                                    <Text style={styles.workerName}>{worker.apodo}</Text>
                                    <Text style={styles.workerRate}>{formatMoney(worker.tarifa)} / día</Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusPill,
                                        attendance.worked ? styles.statusYes : styles.statusNo,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            attendance.worked ? styles.statusTextYes : styles.statusTextNo,
                                        ]}
                                    >
                                        {attendance.worked ? 'SI trabajó' : 'NO trabajó'}
                                    </Text>
                                </View>
                            </View>
                            {!!attendance.extra && (
                                <Text style={styles.extraText}>
                                    Extra: {formatMoney(attendance.extra.monto)} {attendance.extra.nota}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                        date &&
                        router.push({
                            pathname: '/hoy/editar',
                            params: { date },
                        })
                    }
                >
                    <MaterialIcons name="edit" size={20} color={Colors.textInverse} />
                    <Text style={styles.editText}>Editar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    iconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    title: { fontSize: 20, fontWeight: '700', color: Colors.text },
    content: {
        padding: Spacing.base,
        paddingBottom: 140,
    },
    dateTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
        textTransform: 'capitalize',
    },
    readOnlyBadge: {
        alignSelf: 'flex-start',
        marginTop: 8,
        marginBottom: Spacing.base,
        backgroundColor: Colors.slate100,
        borderColor: Colors.border,
        borderWidth: 1,
        color: Colors.slate700,
        fontWeight: '700',
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    list: { gap: 12 },
    card: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    workerName: { fontSize: 18, fontWeight: '700', color: Colors.text },
    workerRate: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
    statusPill: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
    },
    statusYes: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
    },
    statusNo: {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
    },
    statusText: { fontSize: 12, fontWeight: '800' },
    statusTextYes: { color: '#166534' },
    statusTextNo: { color: '#991b1b' },
    extraText: {
        marginTop: 8,
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: Spacing.base,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    editButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    editText: { color: Colors.textInverse, fontSize: 17, fontWeight: '800' },
});
