import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Avatar } from '../../src/components/Avatar';
import { Chip } from '../../src/components/Chip';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney, formatMoneyWithSign } from '../../src/utils';

export default function PagosScreen() {
    const router = useRouter();
    const { getPayroll, markWeekPaid, weekPagada } = useAppStore();
    const payroll = getPayroll();

    const handleMarkPaid = () => {
        markWeekPaid();
        router.push('/pagos/semana-pagada');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pagos</Text>
                <TouchableOpacity style={styles.headerButton}>
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
                        <TouchableOpacity style={styles.weekArrow}>
                            <MaterialIcons name="chevron-left" size={24} color={Colors.textTertiary} />
                        </TouchableOpacity>
                        <View style={styles.weekCenter}>
                            <Text style={styles.weekLabel}>SEMANA ACTUAL</Text>
                            <Text style={styles.weekDates}>{payroll.dateRange}</Text>
                        </View>
                        <TouchableOpacity style={styles.weekArrow}>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notification Banner */}
                <View style={styles.banner}>
                    <MaterialIcons name="event" size={20} color={Colors.primary} />
                    <View style={styles.bannerText}>
                        <Text style={styles.bannerTitle}>Día de pago: Sábado</Text>
                        <Text style={styles.bannerSubtitle}>Revisa los montos antes de dispersar el efectivo.</Text>
                    </View>
                </View>

                {/* Worker Payroll Cards */}
                <View style={styles.workerList}>
                    {payroll.workers.map((entry) => (
                        <View key={entry.workerId} style={[styles.payrollCard, Shadows.card]}>
                            <View style={styles.payrollHeader}>
                                <View style={styles.payrollHeaderLeft}>
                                    <Avatar iniciales={entry.iniciales} colorIndex={entry.avatarColorIndex} size={40} />
                                    <View>
                                        <Text style={styles.payrollName}>{entry.apodo}</Text>
                                        <Text style={styles.payrollRole}>{entry.rol.charAt(0).toUpperCase() + entry.rol.slice(1)}</Text>
                                    </View>
                                </View>
                                {entry.workerId === '2' && (
                                    <Chip label="Completo" variant="success" small />
                                )}
                            </View>

                            <View style={styles.payrollLines}>
                                <View style={styles.payrollLine}>
                                    <Text style={styles.payrollLineLabel}>
                                        Días ({entry.diasTrabajados} x {formatMoney(entry.tarifa)})
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
                        style={[styles.markPaidButton, Shadows.primaryButton, weekPagada && styles.markPaidDone]}
                        onPress={handleMarkPaid}
                        disabled={weekPagada}
                    >
                        <MaterialIcons name="check-circle" size={22} color={Colors.textInverse} />
                        <Text style={styles.markPaidText}>
                            {weekPagada ? 'Semana pagada ✓' : 'Marcar semana pagada'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.whatsappButton}>
                        <MaterialIcons name="share" size={24} color={Colors.textInverse} />
                    </TouchableOpacity>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Semanal</Text>
                    <Text style={styles.totalValue}>{formatMoney(payroll.totalSemanal)}</Text>
                </View>
            </View>
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
    whatsappButton: {
        backgroundColor: Colors.whatsapp,
        padding: 14,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
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
});
