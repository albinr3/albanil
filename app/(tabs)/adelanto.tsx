import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Avatar } from '../../src/components/Avatar';
import { Chip } from '../../src/components/Chip';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney, formatDateShort } from '../../src/utils';

export default function AdelantoScreen() {
    const { workers, advances, addAdvance } = useAppStore();
    const activeWorkers = workers.filter((w) => w.activo);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [amount, setAmount] = useState('');
    const [nota, setNota] = useState('');
    const [showPicker, setShowPicker] = useState(false);

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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Adelantos</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="history" size={24} color={Colors.primary} />
                </TouchableOpacity>
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
                    <TouchableOpacity
                        style={styles.selectorContainer}
                        onPress={() => setShowPicker(!showPicker)}
                    >
                        <MaterialIcons name="person" size={22} color={Colors.textTertiary} />
                        <Text style={[styles.selectorText, !selectedWorkerObj && styles.selectorPlaceholder]}>
                            {selectedWorkerObj ? selectedWorkerObj.apodo : 'Seleccionar trabajador'}
                        </Text>
                        <MaterialIcons name="expand-more" size={22} color={Colors.textTertiary} />
                    </TouchableOpacity>

                    {showPicker && (
                        <View style={styles.pickerDropdown}>
                            {activeWorkers.map((w) => (
                                <TouchableOpacity
                                    key={w.id}
                                    style={[styles.pickerItem, w.id === selectedWorker && styles.pickerItemActive]}
                                    onPress={() => {
                                        setSelectedWorker(w.id);
                                        setShowPicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemText}>{w.apodo}</Text>
                                </TouchableOpacity>
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
                    <TouchableOpacity
                        style={[styles.submitButton, Shadows.primaryButton, (!selectedWorker || !amount) && styles.submitDisabled]}
                        onPress={handleSubmit}
                        disabled={!selectedWorker || !amount}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="add-circle" size={22} color={Colors.textInverse} />
                        <Text style={styles.submitText}>Registrar adelanto</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Advances */}
                <View style={styles.recentSection}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.recentTitle}>Recientes</Text>
                        <TouchableOpacity>
                            <Text style={styles.recentLink}>Ver todo</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.advanceList}>
                        {advances.map((adv) => (
                            <View key={adv.id} style={[styles.advanceItem, Shadows.card, adv.estado === 'descontado' && styles.advanceItemDone]}>
                                <View style={styles.advanceItemLeft}>
                                    <Avatar iniciales={adv.workerIniciales} colorIndex={adv.avatarColorIndex} size={40} />
                                    <View>
                                        <Text style={styles.advanceItemName}>{adv.workerApodo}</Text>
                                        <Text style={styles.advanceItemDate}>{formatDateShort(adv.fecha)}</Text>
                                    </View>
                                </View>
                                <View style={styles.advanceItemRight}>
                                    <Text style={styles.advanceItemAmount}>{formatMoney(adv.monto)}</Text>
                                    <Chip label={chipLabel(adv.estado)} variant={chipVariant(adv.estado)} small />
                                </View>
                            </View>
                        ))}
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
});
