import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { fetchLastWorkedDates } from '../../src/db/repository';
import { Avatar } from '../../src/components/Avatar';
import { Chip } from '../../src/components/Chip';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney, formatDateShort } from '../../src/utils';
import type { Advance } from '../../src/store/types';

export default function AdelantoScreen() {
    const { workers, advances, addAdvance, cancelAdvance } = useAppStore();
    const activeWorkers = workers.filter((w) => w.activo);
    const [lastWorkedByWorkerId, setLastWorkedByWorkerId] = useState<Record<string, string>>({});
    const [selectedWorker, setSelectedWorker] = useState('');
    const [amount, setAmount] = useState('');
    const [nota, setNota] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [showAdvanceMenu, setShowAdvanceMenu] = useState(false);
    const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            const rows = await fetchLastWorkedDates();
            if (mounted) setLastWorkedByWorkerId(rows);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const sortedActiveWorkers = useMemo(() => {
        return [...activeWorkers].sort((a, b) => {
            const aLast = lastWorkedByWorkerId[a.id] ?? '';
            const bLast = lastWorkedByWorkerId[b.id] ?? '';
            if (aLast !== bLast) {
                return bLast.localeCompare(aLast);
            }
            return a.apodo.localeCompare(b.apodo, 'es');
        });
    }, [activeWorkers, lastWorkedByWorkerId]);

    const handleSubmit = () => {
        if (!selectedWorker || !amount) return;
        addAdvance(selectedWorker, parseFloat(amount), nota);
        setAmount('');
        setNota('');
        setSelectedWorker('');
    };

    const selectedWorkerObj = workers.find((w) => w.id === selectedWorker);

    const chipVariant = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'info';
            case 'parcial': return 'warning';
            case 'descontado': return 'success';
            default: return 'neutral';
        }
    };

    const chipLabel = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'parcial': return 'Parcial';
            case 'descontado': return 'Descontado';
            default: return estado;
        }
    };

    const advanceAmountToShow = (estado: string, monto: number, saldoPendiente: number) =>
        estado === 'descontado' ? monto : saldoPendiente;

    const canCancelSelectedAdvance = !!selectedAdvance && selectedAdvance.estado !== 'descontado';

    const openAdvanceMenu = (advance: Advance) => {
        setSelectedAdvance(advance);
        setShowAdvanceMenu(true);
    };

    const closeAdvanceMenu = () => {
        setShowAdvanceMenu(false);
    };

    const handleCancelAdvancePress = () => {
        if (!selectedAdvance) return;
        const targetAdvance = selectedAdvance;
        setShowAdvanceMenu(false);
        Alert.alert(
            'Cancelar adelanto',
            `Se eliminará el adelanto de ${targetAdvance.workerApodo} por ${formatMoney(targetAdvance.saldoPendiente)}. Esta acción no se puede deshacer.`,
            [
                { text: 'Volver', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () => cancelAdvance(targetAdvance.id),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Adelantos</Text>
                <Pressable style={styles.headerButton}>
                    <MaterialIcons name="history" size={24} color={Colors.primary} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Input Form Card */}
                <View style={[styles.formCard, Shadows.card]}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formHeaderLabel}>Nueva entrada</Text>
                        <View style={styles.todayBadge}>
                            <MaterialIcons name="calendar-today" size={14} color={Colors.primary} />
                            <Text style={styles.todayBadgeText}>Hoy</Text>
                        </View>
                    </View>

                    {/* Worker Selector */}
                    <Pressable
                        style={styles.selectorContainer}
                        onPress={() => setShowPicker(!showPicker)}
                    >
                        <MaterialIcons name="person" size={22} color={Colors.textTertiary} />
                        <Text style={[styles.selectorText, !selectedWorkerObj && styles.selectorPlaceholder]}>
                            {selectedWorkerObj ? selectedWorkerObj.apodo : 'Seleccionar trabajador'}
                        </Text>
                        <MaterialIcons name="expand-more" size={22} color={Colors.textTertiary} />
                    </Pressable>

                    {showPicker && (
                        <View style={styles.pickerDropdown}>
                            {sortedActiveWorkers.map((w) => (
                                <Pressable
                                    key={w.id}
                                    style={[styles.pickerItem, w.id === selectedWorker && styles.pickerItemActive]}
                                    onPress={() => {
                                        setSelectedWorker(w.id);
                                        setShowPicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemText}>{w.apodo}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* Amount Input */}
                    <View style={styles.amountSection}>
                        <Text style={styles.amountLabel}>MONTO A ADELANTAR</Text>
                        <View style={styles.amountInputRow}>
                            <Text style={styles.amountPrefix}>RD$</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor={Colors.slate200}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.amountDivider} />
                    </View>

                    {/* Note */}
                    <View style={styles.noteContainer}>
                        <MaterialIcons name="edit-note" size={20} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.noteInput}
                            value={nota}
                            onChangeText={setNota}
                            placeholder="Nota opcional (ej. Comida, Pasaje)"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        style={[styles.submitButton, Shadows.primaryButton, (!selectedWorker || !amount) && styles.submitDisabled]}
                        onPress={handleSubmit}
                        disabled={!selectedWorker || !amount}
                    >
                        <MaterialIcons name="add-circle" size={22} color={Colors.textInverse} />
                        <Text style={styles.submitText}>Registrar adelanto</Text>
                    </Pressable>
                </View>

                {/* Recent Advances */}
                <View style={styles.recentSection}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.recentTitle}>Recientes</Text>
                        <Pressable>
                            <Text style={styles.recentLink}>Ver todo</Text>
                        </Pressable>
                    </View>

                    <View style={styles.advanceList}>
                        {advances.map((adv) => (
                            <Pressable
                                key={adv.id}
                                style={[styles.advanceItem, Shadows.card, adv.estado === 'descontado' && styles.advanceItemDone]}
                                onLongPress={() => openAdvanceMenu(adv)}
                                delayLongPress={600}
                            >
                                <View style={styles.advanceItemLeft}>
                                    <Avatar iniciales={adv.workerIniciales} colorIndex={adv.avatarColorIndex} size={40} />
                                    <View>
                                        <Text style={styles.advanceItemName}>{adv.workerApodo}</Text>
                                        <Text style={styles.advanceItemDate}>{formatDateShort(adv.fecha)}</Text>
                                    </View>
                                </View>
                                <View style={styles.advanceItemRight}>
                                    <Text style={styles.advanceItemAmount}>
                                        {formatMoney(advanceAmountToShow(adv.estado, adv.monto, adv.saldoPendiente))}
                                    </Text>
                                    <Chip label={chipLabel(adv.estado)} variant={chipVariant(adv.estado)} small />
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal
                visible={showAdvanceMenu}
                transparent
                animationType="fade"
                onRequestClose={closeAdvanceMenu}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Opciones del adelanto</Text>
                        <Text style={styles.modalText}>
                            {selectedAdvance
                                ? `${selectedAdvance.workerApodo} • ${formatMoney(selectedAdvance.saldoPendiente)}`
                                : 'Selecciona una opción'}
                        </Text>
                        {!canCancelSelectedAdvance && (
                            <Text style={styles.modalHint}>
                                Este adelanto ya está descontado y no puede cancelarse.
                            </Text>
                        )}
                        <Pressable
                            style={[
                                styles.modalDangerButton,
                                !canCancelSelectedAdvance && styles.modalButtonDisabled,
                            ]}
                            onPress={handleCancelAdvancePress}
                            disabled={!canCancelSelectedAdvance}
                        >
                            <Text style={styles.modalDangerButtonText}>Cancelar adelanto</Text>
                        </Pressable>
                        <Pressable style={styles.modalCancelButton} onPress={closeAdvanceMenu}>
                            <Text style={styles.modalCancelButtonText}>Cerrar</Text>
                        </Pressable>
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
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
    },
    headerButton: {
        padding: 8,
        borderRadius: BorderRadius.full,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.xl,
    },
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        gap: 20,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formHeaderLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    todayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    todayBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    selectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.slate50,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 12,
        paddingVertical: 14,
        gap: 8,
    },
    selectorText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    selectorPlaceholder: {
        color: Colors.textTertiary,
    },
    pickerDropdown: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    pickerItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    pickerItemActive: {
        backgroundColor: Colors.primaryLight,
    },
    pickerItemText: {
        fontSize: 16,
        color: Colors.text,
    },
    amountSection: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    amountLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    amountInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountPrefix: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textTertiary,
        marginRight: 4,
    },
    amountInput: {
        fontSize: 40,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        minWidth: 100,
        padding: 8,
    },
    amountDivider: {
        height: 1,
        width: '100%',
        backgroundColor: Colors.border,
        marginTop: 8,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.slate50,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    noteInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: 16,
    },
    submitDisabled: {
        opacity: 0.5,
    },
    submitText: {
        color: Colors.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    recentSection: {
        marginTop: 32,
        gap: 12,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    recentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    recentLink: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary,
    },
    advanceList: {
        gap: 12,
    },
    advanceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    advanceItemDone: {
        opacity: 0.75,
    },
    advanceItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    advanceItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    advanceItemDate: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    advanceItemRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    advanceItemAmount: {
        fontSize: 15,
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
    },
    modalHint: {
        fontSize: 12,
        color: Colors.textTertiary,
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
