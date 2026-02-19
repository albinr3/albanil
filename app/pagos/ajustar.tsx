import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Avatar } from '../../src/components/Avatar';
import { BorderRadius, Colors, Shadows, Spacing } from '../../src/theme';
import { formatMoney } from '../../src/utils';

function toCurrencyInput(raw: string): string {
    return raw.replace(/[^\d]/g, '');
}

function toNumber(raw: string): number {
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
}

export default function AjustarPagosScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { workerId } = useLocalSearchParams<{ workerId?: string }>();
    const { getPayroll, setPayrollAdjustment } = useAppStore();
    const payroll = getPayroll();
    const selectedWorker = useMemo(
        () => payroll.workers.find((worker) => worker.workerId === workerId),
        [payroll.workers, workerId]
    );

    const [extras, setExtras] = useState(selectedWorker?.extras ? String(selectedWorker.extras) : '');
    const [adelantos, setAdelantos] = useState(selectedWorker?.adelantos ? String(selectedWorker.adelantos) : '');

    if (!selectedWorker) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialIcons name="chevron-left" size={28} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ver / Ajustar Pagos</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={28} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No se encontro el trabajador para ajustar.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const extrasValue = toNumber(extras);
    const adelantosValue = toNumber(adelantos);
    const totalAjustado = selectedWorker.totalDias + extrasValue - adelantosValue;

    const onSave = () => {
        setPayrollAdjustment(selectedWorker.workerId, extrasValue, adelantosValue);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="chevron-left" size={28} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ver / Ajustar Pagos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 190 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.card, Shadows.card]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.workerLeft}>
                            <Avatar iniciales={selectedWorker.iniciales} colorIndex={selectedWorker.avatarColorIndex} size={44} />
                            <View>
                                <Text style={styles.workerName}>{selectedWorker.apodo}</Text>
                                <Text style={styles.workerMeta}>
                                    {selectedWorker.diasTrabajados} dias x {formatMoney(selectedWorker.tarifa)}
                                </Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.baseLabel}>Base</Text>
                            <Text style={styles.baseValue}>{formatMoney(selectedWorker.totalDias)}</Text>
                        </View>
                    </View>

                    <View style={styles.inputsWrap}>
                        <View style={styles.field}>
                            <Text style={[styles.fieldLabel, styles.extrasLabel]}>Extras</Text>
                            <View style={[styles.inputWrap, styles.extrasInputWrap]}>
                                <Text style={[styles.prefix, styles.extrasPrefix]}>RD$</Text>
                                <TextInput
                                    style={[styles.input, styles.extrasInput]}
                                    value={extras}
                                    onChangeText={(text) => setExtras(toCurrencyInput(text))}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={Colors.slate300}
                                />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={[styles.fieldLabel, styles.adelantoLabel]}>Adelanto a descontar</Text>
                            <View style={[styles.inputWrap, styles.adelantoInputWrap]}>
                                <Text style={[styles.prefix, styles.adelantoPrefix]}>RD$</Text>
                                <TextInput
                                    style={[styles.input, styles.adelantoInput]}
                                    value={adelantos}
                                    onChangeText={(text) => setAdelantos(toCurrencyInput(text))}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={Colors.slate300}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total ajustado</Text>
                        <Text style={styles.totalValue}>{formatMoney(totalAjustado)}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.base) }]}>
                <TouchableOpacity style={[styles.saveButton, Shadows.primaryButton]} onPress={onSave} activeOpacity={0.85}>
                    <MaterialIcons name="save" size={20} color={Colors.textInverse} />
                    <Text style={styles.saveButtonText}>Guardar ajustes</Text>
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
        paddingTop: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.base,
    },
    workerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    workerName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    workerMeta: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    baseLabel: {
        fontSize: 11,
        color: Colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'right',
    },
    baseValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    inputsWrap: {
        paddingHorizontal: Spacing.base,
        paddingBottom: Spacing.base,
        gap: 10,
    },
    field: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    extrasLabel: {
        color: Colors.successDark,
    },
    adelantoLabel: {
        color: Colors.dangerDark,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.slate50,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 12,
    },
    extrasInputWrap: {
        backgroundColor: Colors.successLight,
        borderColor: 'rgba(34, 197, 94, 0.35)',
    },
    adelantoInputWrap: {
        backgroundColor: Colors.dangerLight,
        borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    prefix: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    extrasPrefix: {
        color: Colors.successDark,
    },
    adelantoPrefix: {
        color: Colors.dangerDark,
    },
    input: {
        flex: 1,
        paddingVertical: 11,
        paddingHorizontal: 8,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    extrasInput: {
        color: Colors.successDark,
    },
    adelantoInput: {
        color: Colors.dangerDark,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        backgroundColor: Colors.slate50,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.primary,
    },
    footer: {
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.base,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    saveButtonText: {
        color: Colors.textInverse,
        fontSize: 17,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: Spacing['2xl'],
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 15,
        textAlign: 'center',
    },
});
