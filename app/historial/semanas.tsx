import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Chip } from '../../src/components/Chip';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney } from '../../src/utils';

export default function HistorialSemanasScreen() {
    const router = useRouter();
    const { weekHistory } = useAppStore();

    const estadoVariant = (estado: string) => {
        switch (estado) {
            case 'pagada': return 'success';
            case 'en_curso': return 'primary';
            case 'archivada': return 'neutral';
            default: return 'neutral';
        }
    };

    const estadoLabel = (estado: string) => {
        switch (estado) {
            case 'pagada': return 'Pagada';
            case 'en_curso': return 'En curso';
            case 'archivada': return 'Archivada';
            default: return estado;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="chevron-left" size={28} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Pagos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, Shadows.card]}>
                        <Text style={styles.statLabel}>Total Mes (Feb)</Text>
                        <Text style={styles.statValue}>RD$ 435,500</Text>
                    </View>
                    <View style={[styles.statCard, Shadows.card]}>
                        <Text style={styles.statLabel}>Trabajadores</Text>
                        <View style={styles.statWithIcon}>
                            <MaterialIcons name="group" size={16} color={Colors.success} />
                            <Text style={styles.statValue}>24</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>SEMANAS ANTERIORES</Text>
                    <TouchableOpacity>
                        <Text style={styles.filterLink}>Filtrar</Text>
                    </TouchableOpacity>
                </View>

                {/* Week Cards */}
                <View style={styles.weekList}>
                    {weekHistory.map((week, i) => (
                        <TouchableOpacity
                            key={week.weekId}
                            style={[
                                styles.weekCard,
                                Shadows.card,
                                i === 0 && styles.weekCardFeatured,
                                week.estado === 'archivada' && styles.weekCardArchived,
                            ]}
                            onPress={() => {
                                if (week.estado === 'pagada' || week.estado === 'en_curso') {
                                    router.push('/pagos/semana-pagada');
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.weekCardTop}>
                                <View>
                                    {i === 0 && (
                                        <Chip label={estadoLabel(week.estado)} variant={estadoVariant(week.estado)} small />
                                    )}
                                    <Text style={[styles.weekCardTitle, i !== 0 && { marginTop: 0 }]}>
                                        {week.weekLabel}
                                    </Text>
                                    {i !== 0 && (
                                        <Text style={styles.weekCardWorkers}>{week.workerCount} Trabajadores</Text>
                                    )}
                                </View>
                                <View style={styles.weekCardRight}>
                                    {i !== 0 && (
                                        <Chip label={estadoLabel(week.estado)} variant={estadoVariant(week.estado)} small />
                                    )}
                                    <Text style={[
                                        styles.weekCardAmount,
                                        week.estado === 'archivada' && styles.weekCardAmountArchived,
                                    ]}>
                                        {formatMoney(week.totalAmount)}
                                    </Text>
                                </View>
                            </View>
                            {i === 0 && (
                                <View style={styles.weekCardBottom}>
                                    <View>
                                        <Text style={styles.weekCardSubLabel}>Monto total</Text>
                                        <Text style={styles.weekCardBigAmount}>{formatMoney(week.totalAmount)}</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={Colors.slate300} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
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
        padding: Spacing.base,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.base,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    statWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.base,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterLink: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary,
    },
    weekList: {
        gap: 12,
    },
    weekCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    weekCardFeatured: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    weekCardArchived: {
        opacity: 0.8,
    },
    weekCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    weekCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 8,
    },
    weekCardWorkers: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    weekCardRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    weekCardAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    weekCardAmountArchived: {
        color: Colors.slate700,
    },
    weekCardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 12,
    },
    weekCardSubLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    weekCardBigAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
});
