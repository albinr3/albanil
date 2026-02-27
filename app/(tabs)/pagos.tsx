import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { fetchPayrollByWeekId } from '../../src/db/repository';
import { Avatar } from '../../src/components/Avatar';
import { Chip } from '../../src/components/Chip';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney, formatMoneyWithSign, formatWorkDays } from '../../src/utils';

export default function PagosScreen() {
    const router = useRouter();
    const { getPayroll, markWeekPaid, unmarkWeekPaid, weekHistory, reloadSnapshot } = useAppStore();
    const currentPayroll = getPayroll();
    const [selectedWeekId, setSelectedWeekId] = useState(currentPayroll.weekId);
    const [displayPayroll, setDisplayPayroll] = useState(currentPayroll);
    const [isLoadingWeek, setIsLoadingWeek] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isUpdatingWeekState, setIsUpdatingWeekState] = useState(false);

    useEffect(() => {
        setDisplayPayroll(currentPayroll);
        if (!selectedWeekId) {
            setSelectedWeekId(currentPayroll.weekId);
        }
    }, [currentPayroll, selectedWeekId]);

    useEffect(() => {
        let mounted = true;
        if (!selectedWeekId) return;
        if (selectedWeekId === currentPayroll.weekId) {
            setDisplayPayroll(currentPayroll);
            setIsLoadingWeek(false);
            return;
        }
        setIsLoadingWeek(true);
        void (async () => {
            try {
                const weekPayroll = await fetchPayrollByWeekId(selectedWeekId);
                if (!mounted) return;
                setDisplayPayroll(weekPayroll);
            } finally {
                if (mounted) setIsLoadingWeek(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [selectedWeekId, currentPayroll]);

    useFocusEffect(
        React.useCallback(() => {
            void reloadSnapshot();
        }, [reloadSnapshot])
    );

    const selectedWeekIndex = useMemo(
        () => weekHistory.findIndex((week) => week.weekId === selectedWeekId),
        [weekHistory, selectedWeekId]
    );
    const hasOlderWeek = selectedWeekIndex >= 0 && selectedWeekIndex < weekHistory.length - 1;
    const hasNewerWeek = selectedWeekIndex > 0;
    const isCurrentWeekSelected = selectedWeekId === currentPayroll.weekId;
    const canMarkPaid = isCurrentWeekSelected && !displayPayroll.pagada;
    const canUnmarkPaid = isCurrentWeekSelected && displayPayroll.pagada;

    const handleMarkPaid = async () => {
        const ok = await markWeekPaid();
        if (ok) router.push('/pagos/semana-pagada');
    };

    const handleUnmarkPaid = async () => {
        if (!canUnmarkPaid || isUpdatingWeekState) return;
        setIsUpdatingWeekState(true);
        try {
            const ok = await unmarkWeekPaid();
            if (ok) setShowSettingsModal(false);
        } finally {
            setIsUpdatingWeekState(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pagos</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowSettingsModal(true)}
                >
                    <MaterialIcons name="settings" size={24} color={Colors.slate600} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Week Selector */}
                <View style={styles.weekSelector}>
                    <View style={styles.weekSelectorInner}>
                        <TouchableOpacity
                            style={styles.weekArrow}
                            onPress={() => {
                                if (!hasOlderWeek) return;
                                setSelectedWeekId(weekHistory[selectedWeekIndex + 1].weekId);
                            }}
                            disabled={!hasOlderWeek}
                        >
                            <MaterialIcons
                                name="chevron-left"
                                size={24}
                                color={hasOlderWeek ? Colors.primary : Colors.textTertiary}
                            />
                        </TouchableOpacity>
                        <View style={styles.weekCenter}>
                            <Text style={styles.weekLabel}>
                                {displayPayroll.weekLabel.toUpperCase()}
                            </Text>
                            <Text style={styles.weekDates}>{displayPayroll.dateRange}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.weekArrow}
                            onPress={() => {
                                if (!hasNewerWeek) return;
                                setSelectedWeekId(weekHistory[selectedWeekIndex - 1].weekId);
                            }}
                            disabled={!hasNewerWeek}
                        >
                            <MaterialIcons
                                name="chevron-right"
                                size={24}
                                color={hasNewerWeek ? Colors.primary : Colors.textTertiary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notification Banner */}
                <View style={styles.banner}>
                    <MaterialIcons name="event" size={20} color={Colors.primary} />
                    <View style={styles.bannerText}>
                        <Text style={styles.bannerTitle}>
                            {displayPayroll.pagada ? 'Semana cerrada' : 'Semana en curso'}
                        </Text>
                        <Text style={styles.bannerSubtitle}>
                            {isLoadingWeek ? 'Cargando nomina...' : 'Revisa los montos antes de dispersar el efectivo.'}
                        </Text>
                    </View>
                </View>

                {/* Worker Payroll Cards */}
                <View style={styles.workerList}>
                    {displayPayroll.workers.map((entry) => (
                        <View key={entry.workerId} style={[styles.payrollCard, Shadows.card]}>
                            <View style={styles.payrollHeader}>
                                <View style={styles.payrollHeaderLeft}>
                                    <Avatar iniciales={entry.iniciales} colorIndex={entry.avatarColorIndex} size={40} />
                                    <View>
                                        <Text style={styles.payrollName}>{entry.apodo}</Text>
                                        <Text style={styles.payrollRole}>{entry.rol.charAt(0).toUpperCase() + entry.rol.slice(1)}</Text>
                                    </View>
                                </View>
                                <Chip label={displayPayroll.pagada ? 'Pagado' : 'Abierto'} variant={displayPayroll.pagada ? 'success' : 'primary'} small />
                            </View>

                            <View style={styles.payrollLines}>
                                <View style={styles.payrollLine}>
                                    <Text style={styles.payrollLineLabel}>
                                        Días ({formatWorkDays(entry.diasTrabajados)} x {formatMoney(entry.tarifa)})
                                    </Text>
                                    <Text style={styles.payrollLineValue}>{formatMoney(entry.totalDias)}</Text>
                                </View>
                                <View style={styles.payrollLine}>
                                    <Text style={styles.payrollLineLabel}>Extras</Text>
                                    <Text
                                        style={[
                                            styles.payrollLineValue,
                                            entry.extras > 0 ? styles.textGreen : styles.textMuted,
                                        ]}
                                    >
                                        {entry.extras > 0 ? formatMoneyWithSign(entry.extras, '+') : '--'}
                                    </Text>
                                </View>
                                <View style={styles.payrollLine}>
                                    <Text style={styles.payrollLineLabel}>Adelantos</Text>
                                    <Text
                                        style={[
                                            styles.payrollLineValue,
                                            entry.adelantos > 0 ? styles.textRed : styles.textMuted,
                                        ]}
                                    >
                                        {entry.adelantos > 0 ? formatMoneyWithSign(entry.adelantos, '-') : '--'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.payrollFooter}>
                                <View>
                                    <Text style={styles.payrollTotalLabel}>TOTAL A PAGAR</Text>
                                    <Text style={styles.payrollTotalValue}>{formatMoney(entry.totalPagar)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.adjustButton}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/pagos/ajustar',
                                            params: { workerId: entry.workerId },
                                        })
                                    }
                                >
                                    <Text style={styles.adjustButtonText}>Ver / ajustar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={[styles.markPaidButton, Shadows.primaryButton, !canMarkPaid && styles.markPaidDone]}
                        onPress={handleMarkPaid}
                        disabled={!canMarkPaid}
                    >
                        <MaterialIcons name="check-circle" size={22} color={Colors.textInverse} />
                        <Text style={styles.markPaidText}>
                            {canMarkPaid
                                ? 'Marcar semana pagada'
                                : isCurrentWeekSelected
                                    ? 'Semana pagada ✓'
                                    : 'Solo semana actual'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Semanal</Text>
                    <Text style={styles.totalValue}>{formatMoney(displayPayroll.totalSemanal)}</Text>
                </View>
            </View>

            <Modal
                visible={showSettingsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettingsModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Ajustes de pagos</Text>
                        <Text style={styles.modalText}>
                            Puedes reabrir la semana actual para quitarla como pagada.
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.modalDangerButton,
                                (!canUnmarkPaid || isUpdatingWeekState) && styles.modalButtonDisabled,
                            ]}
                            onPress={handleUnmarkPaid}
                            disabled={!canUnmarkPaid || isUpdatingWeekState}
                        >
                            <Text style={styles.modalDangerButtonText}>
                                {isUpdatingWeekState ? 'Actualizando...' : 'Quitar semana pagada'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowSettingsModal(false)}
                            disabled={isUpdatingWeekState}
                        >
                            <Text style={styles.modalCancelButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    headerButton: {
        padding: 8,
        borderRadius: BorderRadius.full,
    },
    scroll: { flex: 1 },
    scrollContent: {},
    weekSelector: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        marginBottom: Spacing.base,
    },
    weekSelectorInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        padding: 4,
    },
    weekArrow: {
        padding: 8,
    },
    weekCenter: {
        alignItems: 'center',
    },
    weekLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    weekDates: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
        backgroundColor: Colors.primaryLighter,
        borderWidth: 1,
        borderColor: 'rgba(13, 108, 242, 0.2)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
    },
    bannerText: {},
    bannerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: Colors.slate600,
        marginTop: 4,
    },
    workerList: {
        paddingHorizontal: Spacing.xl,
        gap: 16,
    },
    payrollCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        overflow: 'hidden',
    },
    payrollHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: Spacing.lg,
        paddingBottom: Spacing.base,
    },
    payrollHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    payrollName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    payrollRole: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    payrollLines: {
        paddingHorizontal: Spacing.lg,
        gap: 8,
        marginBottom: Spacing.lg,
    },
    payrollLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    payrollLineLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    payrollLineValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    textGreen: { color: Colors.success },
    textRed: { color: Colors.danger },
    textMuted: { color: Colors.slate300 },
    payrollFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        padding: Spacing.lg,
    },
    payrollTotalLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    payrollTotalValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primary,
    },
    adjustButton: {
        backgroundColor: Colors.slate100,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.lg,
    },
    adjustButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.slate700,
    },
    bottomBar: {
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: Spacing.base,
        paddingBottom: Spacing['2xl'],
    },
    bottomActions: {
        flexDirection: 'row',
        gap: 12,
    },
    markPaidButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
    },
    markPaidDone: {
        backgroundColor: Colors.success,
    },
    markPaidText: {
        color: Colors.textInverse,
        fontSize: 15,
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.base,
        paddingHorizontal: 8,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: Spacing.lg,
        gap: Spacing.base,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    modalText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    modalDangerButton: {
        backgroundColor: Colors.danger,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.base,
        alignItems: 'center',
    },
    modalDangerButtonText: {
        color: Colors.textInverse,
        fontSize: 15,
        fontWeight: '700',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalCancelButton: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.base,
        alignItems: 'center',
    },
    modalCancelButtonText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
