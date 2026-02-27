import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Chip } from '../../src/components/Chip';
import { fetchWorkerPayrollHistory } from '../../src/db/repository';
import type { EstadoAdelanto } from '../../src/store/types';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { SCREEN_SAFE_AREA_EDGES, useStickyFooterLayout } from '../../src/ui/safeArea';
import { formatDateShort, formatMoney, formatWorkDays } from '../../src/utils';

type TabType = 'historial' | 'adelantos';

export default function TrabajadorDetailScreen() {
    const router = useRouter();
    const { scrollContentPaddingBottom, footerPaddingBottom } = useStickyFooterLayout(132, Spacing.base);
    const { id } = useLocalSearchParams<{ id: string }>();
    const { workers, advances, deactivateWorker, addWorkerToWeek } = useAppStore();
    const worker = workers.find((w) => w.id === id);
    const [activeTab, setActiveTab] = useState<TabType>('historial');
    const [historyRows, setHistoryRows] = useState<
        Array<{
            weekId: string;
            weekLabel: string;
            dateRange: string;
            pagada: boolean;
            diasTrabajados: number;
            tarifa: number;
            totalPagar: number;
        }>
    >([]);

    const loadHistory = useCallback(async () => {
        if (!id) {
            setHistoryRows([]);
            return;
        }
        const rows = await fetchWorkerPayrollHistory(id);
        setHistoryRows(rows);
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            void loadHistory();
        }, [loadHistory])
    );

    if (!worker) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Trabajador no encontrado</Text>
            </SafeAreaView>
        );
    }

    const rolLabel = worker.rol.charAt(0).toUpperCase() + worker.rol.slice(1);
    const pendingAdvances = useMemo(
        () => advances.filter((advance) => advance.workerId === worker.id && advance.estado !== 'descontado'),
        [advances, worker.id]
    );
    const deudaPendiente = useMemo(
        () => pendingAdvances.reduce((acc, advance) => acc + advance.saldoPendiente, 0),
        [pendingAdvances]
    );

    const advanceLabel = (estado: EstadoAdelanto) => {
        if (estado === 'parcial') return 'Parcial';
        if (estado === 'descontado') return 'Descontado';
        return 'Pendiente';
    };
    const advanceVariant = (estado: EstadoAdelanto) => {
        if (estado === 'parcial') return 'warning';
        if (estado === 'descontado') return 'success';
        return 'info';
    };

    return (
        <SafeAreaView style={styles.container} edges={SCREEN_SAFE_AREA_EDGES}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios" size={22} color={Colors.slate600} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle Trabajador</Text>
                <TouchableOpacity style={styles.moreButton}>
                    <MaterialIcons name="more-vert" size={22} color={Colors.slate600} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: scrollContentPaddingBottom }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: Colors.primaryLight }]}>
                                <Text style={styles.avatarText}>{worker.iniciales}</Text>
                            </View>
                            {worker.activo && <View style={styles.activeDot} />}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">{worker.apodo}</Text>
                            <Text style={styles.profileFullName} numberOfLines={1} ellipsizeMode="tail">{worker.nombreCompleto}</Text>
                            <View style={styles.profileRoleRow}>
                                <MaterialIcons name="engineering" size={16} color={Colors.textTertiary} />
                                <Text style={styles.profileRole}>{rolLabel}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Summary Tiles */}
                    <View style={styles.tilesRow}>
                        <View style={styles.tile}>
                            <Text style={styles.tileLabel}>TARIFA</Text>
                            <Text style={styles.tileValue}>{formatMoney(worker.tarifa)}</Text>
                            <Text style={styles.tileSuffix}>/día</Text>
                        </View>
                        <View style={styles.tile}>
                            <Text style={styles.tileLabel}>TIPO</Text>
                            <Chip
                                label={worker.tipo === 'fijo' ? 'Fijo' : 'Por días'}
                                variant={worker.tipo === 'fijo' ? 'success' : 'neutral'}
                            />
                        </View>
                        <View style={[styles.tile, styles.tileDebt]}>
                            <Text style={[styles.tileLabel, { color: Colors.danger }]}>DEUDA</Text>
                            <Text style={[styles.tileValue, { color: Colors.danger }]}>
                                {formatMoney(deudaPendiente)}
                            </Text>
                            <Text style={[styles.tileSuffix, { color: Colors.danger }]}>
                                {deudaPendiente > 0 ? 'Pendiente' : 'Sin deuda'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsOuter}>
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'historial' && styles.tabActive]}
                            onPress={() => setActiveTab('historial')}
                        >
                            <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>
                                Historial
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'adelantos' && styles.tabActive]}
                            onPress={() => setActiveTab('adelantos')}
                        >
                            <Text style={[styles.tabText, activeTab === 'adelantos' && styles.tabTextActive]}>
                                Adelantos
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* History List */}
                    {activeTab === 'historial' && (
                        <View style={styles.listSection}>
                            <Text style={styles.listSectionTitle}>ÚLTIMAS SEMANAS</Text>
                            <View style={styles.historyList}>
                                {historyRows.length === 0 && (
                                    <View style={styles.emptyState}>
                                        <MaterialIcons name="history" size={48} color={Colors.slate300} />
                                        <Text style={styles.emptyStateText}>No hay historial para este trabajador</Text>
                                    </View>
                                )}
                                {historyRows.map((item) => (
                                    <TouchableOpacity key={item.weekId} style={[styles.historyItem, Shadows.card]} activeOpacity={0.7}>
                                        <View style={styles.historyLeft}>
                                            <View style={styles.historyIcon}>
                                                <MaterialIcons name="calendar-month" size={22} color={Colors.primary} />
                                            </View>
                                            <View style={styles.historyMain}>
                                                <Text style={styles.historyWeek} numberOfLines={1} ellipsizeMode="tail">{item.weekLabel}</Text>
                                                <Text style={styles.historyDays} numberOfLines={1} ellipsizeMode="tail">
                                                    {item.dateRange} • {formatWorkDays(item.diasTrabajados)} días x {formatMoney(item.tarifa)}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.historyRight}>
                                            <Text
                                                style={styles.historyTotal}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                                adjustsFontSizeToFit
                                                minimumFontScale={0.75}
                                            >
                                                {formatMoney(item.totalPagar)}
                                            </Text>
                                            {item.pagada && <View style={styles.paidDot} />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {activeTab === 'adelantos' && (
                        <View style={styles.listSection}>
                            <Text style={styles.listSectionTitle}>ADELANTOS PENDIENTES</Text>
                            <View style={styles.advanceList}>
                                {pendingAdvances.length === 0 && (
                                    <View style={styles.emptyState}>
                                        <MaterialIcons name="request-quote" size={48} color={Colors.slate300} />
                                        <Text style={styles.emptyStateText}>No hay adelantos pendientes</Text>
                                    </View>
                                )}
                                {pendingAdvances.map((advance) => (
                                    <View key={advance.id} style={[styles.advanceItem, Shadows.card]}>
                                        <View style={styles.advanceLeft}>
                                            <Text style={styles.advanceTitle} numberOfLines={1} ellipsizeMode="tail">
                                                {advance.nota.trim() || 'Adelanto'}
                                            </Text>
                                            <Text style={styles.advanceMeta} numberOfLines={1} ellipsizeMode="tail">
                                                {formatDateShort(advance.fecha)}
                                            </Text>
                                        </View>
                                        <View style={styles.advanceRight}>
                                            <Text style={styles.advanceAmount} numberOfLines={1} ellipsizeMode="tail">
                                                {formatMoney(advance.saldoPendiente)}
                                            </Text>
                                            <Chip
                                                label={advanceLabel(advance.estado)}
                                                variant={advanceVariant(advance.estado)}
                                                small
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
                <TouchableOpacity
                    style={[styles.deactivateButton, !worker.activo && styles.activateButton]}
                    onPress={() => {
                        if (worker.activo) {
                            deactivateWorker(worker.id);
                        } else {
                            addWorkerToWeek(worker.id);
                        }
                        router.back();
                    }}
                >
                    <MaterialIcons
                        name={worker.activo ? 'person-off' : 'person-add'}
                        size={20}
                        color={worker.activo ? Colors.danger : Colors.success}
                    />
                    <Text style={[styles.deactivateText, !worker.activo && styles.activateText]}>
                        {worker.activo ? 'Desactivar' : 'Activar'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.editButton, Shadows.primaryButton]}
                    onPress={() => router.push(`/trabajador/editar/${worker.id}`)}
                >
                    <MaterialIcons name="edit" size={20} color={Colors.textInverse} />
                    <Text style={styles.editButtonText}>Editar Trabajador</Text>
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
        paddingVertical: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
    },
    moreButton: { padding: 8 },
    scroll: { flex: 1 },
    profileHeader: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing['2xl'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        borderBottomLeftRadius: BorderRadius.lg,
        borderBottomRightRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    profileInfo: {
        flex: 1,
        minWidth: 0,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: Colors.surface,
        ...Shadows.card,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.primary,
    },
    activeDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    profileName: {
        fontSize: 30,
        fontWeight: '700',
        color: Colors.text,
    },
    profileFullName: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    profileRoleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    profileRole: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    tilesRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: Spacing['2xl'],
    },
    tile: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        alignItems: 'center',
        ...Shadows.card,
    },
    tileDebt: {
        backgroundColor: Colors.dangerLight,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    tileLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        textAlign: 'center',
    },
    tileValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        textAlign: 'center',
    },
    tileSuffix: {
        fontSize: 10,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    tabsOuter: {
        paddingHorizontal: Spacing.base,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.slate100,
        borderRadius: 8,
        padding: 4,
        marginBottom: Spacing.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: Colors.surface,
        ...Shadows.card,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    tabTextActive: {
        fontWeight: '600',
        color: Colors.primary,
    },
    listSection: {},
    listSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
        minWidth: 0,
    },
    historyMain: {
        flex: 1,
        minWidth: 0,
    },
    historyIcon: {
        backgroundColor: Colors.infoLight,
        padding: 10,
        borderRadius: 8,
    },
    historyWeek: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    historyDays: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
        marginLeft: 10,
        flexShrink: 1,
        maxWidth: '36%',
        minWidth: 82,
    },
    historyTotal: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'right',
        width: '100%',
    },
    paidDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 16,
        color: Colors.textTertiary,
    },
    advanceList: {
        gap: 12,
    },
    advanceItem: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    advanceLeft: {
        gap: 4,
        flex: 1,
        paddingRight: 8,
    },
    advanceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    advanceMeta: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    advanceRight: {
        alignItems: 'flex-end',
        gap: 6,
        marginLeft: 10,
        flexShrink: 0,
        minWidth: 90,
    },
    advanceAmount: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    deactivateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        backgroundColor: Colors.dangerLight,
    },
    deactivateText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.danger,
    },
    activateButton: {
        borderColor: 'rgba(34, 197, 94, 0.25)',
        backgroundColor: '#dcfce7',
    },
    activateText: {
        color: Colors.success,
    },
    editButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary,
    },
    editButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textInverse,
    },
});
