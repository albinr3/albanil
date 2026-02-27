import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Avatar } from '../../src/components/Avatar';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney, formatWorkDays } from '../../src/utils';

export default function SemanaPagadaScreen() {
    const router = useRouter();
    const { getPayroll } = useAppStore();
    const payroll = getPayroll();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="chevron-left" size={28} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Semana Pagada</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Banner */}
                <View style={styles.statusBanner}>
                    <MaterialIcons name="lock" size={18} color={Colors.textInverse} />
                    <Text style={styles.statusBannerText}>Semana Cerrada • Solo Lectura</Text>
                </View>

                {/* Week Info */}
                <View style={[styles.weekInfoCard, Shadows.card]}>
                    <View style={styles.weekInfoRow}>
                        <View>
                            <Text style={styles.weekInfoLabel}>Semana</Text>
                            <Text style={styles.weekInfoValue}>{payroll.dateRange}</Text>
                        </View>
                        <View style={styles.weekInfoBadge}>
                            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                            <Text style={styles.weekInfoBadgeText}>Pagada</Text>
                        </View>
                    </View>

                    {/* Summary Row */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Trabajadores</Text>
                            <Text style={styles.summaryValue}>{payroll.workers.length}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total pagado</Text>
                            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                                {formatMoney(payroll.totalSemanal)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>DESGLOSE POR TRABAJADOR</Text>

                {/* Worker Breakdown */}
                <View style={styles.breakdownList}>
                    {payroll.workers.map((entry, i) => (
                        <View key={entry.workerId} style={[styles.breakdownCard, Shadows.card]}>
                            <View style={styles.breakdownHeader}>
                                <View style={styles.breakdownLeft}>
                                    <Avatar iniciales={entry.iniciales} colorIndex={entry.avatarColorIndex} size={36} />
                                    <View>
                                        <Text style={styles.breakdownName}>{entry.apodo}</Text>
                                        <Text style={styles.breakdownRole}>
                                            {entry.rol.charAt(0).toUpperCase() + entry.rol.slice(1)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.breakdownLines}>
                                <View style={styles.breakdownLine}>
                                    <Text style={styles.lineLabel}>
                                        {formatWorkDays(entry.diasTrabajados)} días × {formatMoney(entry.tarifa)}
                                    </Text>
                                    <Text style={styles.lineValue}>{formatMoney(entry.totalDias)}</Text>
                                </View>
                                {entry.extras > 0 && (
                                    <View style={styles.breakdownLine}>
                                        <Text style={styles.lineLabel}>Extras</Text>
                                        <Text style={[styles.lineValue, { color: Colors.success }]}>
                                            + {formatMoney(entry.extras)}
                                        </Text>
                                    </View>
                                )}
                                {entry.adelantos > 0 && (
                                    <View style={styles.breakdownLine}>
                                        <Text style={styles.lineLabel}>Adelantos</Text>
                                        <Text style={[styles.lineValue, { color: Colors.danger }]}>
                                            - {formatMoney(entry.adelantos)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.breakdownFooter}>
                                <Text style={styles.breakdownTotalLabel}>NETO</Text>
                                <Text style={styles.breakdownTotal}>{formatMoney(entry.totalPagar)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={[styles.shareButton, Shadows.primaryButton]}>
                    <MaterialIcons name="share" size={22} color={Colors.textInverse} />
                    <Text style={styles.shareButtonText}>Compartir Resumen</Text>
                </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.base,
        paddingTop: 0,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        marginHorizontal: -Spacing.base,
        marginBottom: Spacing.xl,
    },
    statusBannerText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textInverse,
    },
    weekInfoCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        marginBottom: Spacing.xl,
    },
    weekInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.xl,
    },
    weekInfoLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    weekInfoValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    weekInfoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.successLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    weekInfoBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.successDark,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.lg,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.borderLight,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.md,
        paddingHorizontal: 4,
    },
    breakdownList: {
        gap: 12,
    },
    breakdownCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        overflow: 'hidden',
    },
    breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    breakdownName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    breakdownRole: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    breakdownLines: {
        padding: Spacing.base,
        gap: 6,
    },
    breakdownLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    lineLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    lineValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    breakdownFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.slate50,
        padding: Spacing.base,
    },
    breakdownTotalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    breakdownTotal: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    bottomBar: {
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: Spacing.base,
        paddingBottom: Spacing['2xl'],
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    shareButtonText: {
        color: Colors.textInverse,
        fontSize: 17,
        fontWeight: '700',
    },
});
