import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { WorkerCard } from '../../src/components/WorkerCard';
import { fetchAttendanceByDate, toggleAttendanceForDate } from '../../src/db/repository';
import { useAppStore } from '../../src/store/AppContext';
import type { AttendanceRecord, Worker } from '../../src/store/types';
import { BorderRadius, Colors, Spacing } from '../../src/theme';
import { SCREEN_SAFE_AREA_EDGES, useStickyFooterLayout } from '../../src/ui/safeArea';
import { showToast } from '../../src/ui/toast';

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

export default function HoyEditarScreen() {
    const router = useRouter();
    const { scrollContentPaddingBottom, footerPaddingBottom } = useStickyFooterLayout(120, Spacing.base);
    const { date } = useLocalSearchParams<{ date: string }>();
    const { workers } = useAppStore();
    const [attendanceByDate, setAttendanceByDate] = useState<Record<string, AttendanceRecord>>({});

    const loadAttendance = async () => {
        if (!date) return;
        const rows = await fetchAttendanceByDate(date);
        setAttendanceByDate(rows);
    };

    useEffect(() => {
        void loadAttendance();
    }, [date]);

    useFocusEffect(
        React.useCallback(() => {
            void loadAttendance();
        }, [date])
    );

    const dayWorkers = useMemo(() => {
        if (!date) return [];
        return buildWorkersForDate(workers, attendanceByDate, date);
    }, [workers, attendanceByDate, date]);

    const handleToggle = async (workerId: string) => {
        if (!date) return;
        try {
            await toggleAttendanceForDate(workerId, date);
            await loadAttendance();
            showToast({
                type: 'success',
                title: 'Asistencia actualizada',
                message: 'Cambio guardado para este día.',
            });
        } catch {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo actualizar la asistencia.',
            });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={SCREEN_SAFE_AREA_EDGES}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color={Colors.slate700} />
                </TouchableOpacity>
                <Text style={styles.title}>Editar día</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: scrollContentPaddingBottom }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.dateTitle}>{date ? toReadableDate(date) : ''}</Text>

                <View style={styles.infoBanner}>
                    <MaterialIcons name="edit-calendar" size={18} color={Colors.primary} />
                    <Text style={styles.infoText}>Puedes editar asistencia y extras de esta fecha.</Text>
                </View>

                <View style={styles.list}>
                    {dayWorkers.map((worker) => (
                        <WorkerCard
                            key={worker.id}
                            worker={worker}
                            attendance={attendanceByDate[`${worker.id}-${date}`] || { workerId: worker.id, date: date || '', worked: false }}
                            onToggle={() => void handleToggle(worker.id)}
                            onExtraPress={() =>
                                date &&
                                router.push({
                                    pathname: '/modal/extra',
                                    params: { workerId: worker.id, workerName: worker.apodo, date },
                                })
                            }
                        />
                    ))}
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                        showToast({
                            type: 'success',
                            title: 'Edición completada',
                            message: 'Cambios guardados para este día.',
                        });
                        router.back();
                    }}
                >
                    <MaterialIcons name="check-circle" size={20} color={Colors.textInverse} />
                    <Text style={styles.saveText}>Listo</Text>
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
    },
    dateTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.base,
        textTransform: 'capitalize',
    },
    infoBanner: {
        marginBottom: Spacing.base,
        backgroundColor: Colors.primaryLighter,
        borderWidth: 1,
        borderColor: Colors.primaryLight,
        padding: 12,
        borderRadius: BorderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
    list: { gap: 12 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    saveButton: {
        minHeight: 52,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveText: {
        color: Colors.textInverse,
        fontWeight: '800',
        fontSize: 17,
    },
});
