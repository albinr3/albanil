import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { WorkerCard } from '../../src/components/WorkerCard';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { getTodayLabel, getMonthYearLabel } from '../../src/utils';

export default function HoyScreen() {
    const router = useRouter();
    const { workers, getAttendance, toggleAttendance } = useAppStore();
    const activeWorkers = workers.filter((w) => w.activo);
    const totalWorked = activeWorkers.filter((worker) => getAttendance(worker.id).worked).length;
    const totalHalfDay = activeWorkers.filter((worker) => {
        const attendance = getAttendance(worker.id);
        return !attendance.worked && attendance.extra?.tipo === 'medio_dia';
    }).length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.semanaChip}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.semanaChipText}>Semana en curso</Text>
                        </View>
                        <Text style={styles.dayTitle}>{getTodayLabel()}</Text>
                        <Text style={styles.monthSubtitle}>{getMonthYearLabel()}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/backup/historial')}
                    >
                        <MaterialIcons name="settings" size={24} color={Colors.slate600} />
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionPrimary, Shadows.primaryButton]}
                        onPress={() => router.push('/modal/agregar-trabajador')}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="person-add" size={22} color={Colors.textInverse} />
                        <Text style={styles.actionPrimaryText}>Trabajador</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionSecondary}
                        onPress={() => router.push('/hoy/calendario')}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="calendar-view-week" size={22} color={Colors.slate700} />
                        <Text style={styles.actionSecondaryText}>Ver semana</Text>
                    </TouchableOpacity>
                </View>

                {/* Worker Cards */}
                <View style={styles.workerList}>
                    {activeWorkers.map((worker) => {
                        const attendance = getAttendance(worker.id);
                        return (
                            <WorkerCard
                                key={worker.id}
                                worker={worker}
                                attendance={attendance}
                                onToggle={() => toggleAttendance(worker.id)}
                                onExtraPress={() =>
                                    router.push({
                                        pathname: '/modal/extra',
                                        params: {
                                            workerId: worker.id,
                                            workerName: worker.apodo,
                                            worked: attendance.worked ? '1' : '0',
                                            extraMonto: attendance.extra ? String(attendance.extra.monto) : '',
                                            extraNota: attendance.extra?.nota ?? '',
                                            extraTipo: attendance.extra?.tipo ?? 'general',
                                        },
                                    })
                                }
                            />
                        );
                    })}
                </View>

                {/* Summary */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Resumen de hoy</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Trabajaron día completo</Text>
                        <Text style={styles.summaryValue}>{totalWorked}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Trabajaron medio día</Text>
                        <Text style={styles.summaryValue}>{totalHalfDay}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.base,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
    },
    headerLeft: {},
    semanaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        alignSelf: 'flex-start',
        marginBottom: 8,
        gap: 6,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
    },
    semanaChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.successDark,
    },
    dayTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    monthSubtitle: {
        fontSize: 20,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    settingsButton: {
        padding: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    actionPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
    },
    actionPrimaryText: {
        color: Colors.textInverse,
        fontWeight: '700',
        fontSize: 15,
    },
    actionSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionSecondaryText: {
        color: Colors.slate700,
        fontWeight: '700',
        fontSize: 15,
    },
    workerList: {
        gap: 16,
    },
    summaryContainer: {
        marginTop: Spacing.xl,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.base,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        gap: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
});
