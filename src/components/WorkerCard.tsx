import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../theme';
import { formatMoney } from '../utils/money';
import type { Worker, AttendanceRecord } from '../store/types';

interface WorkerCardProps {
    worker: Worker;
    attendance: AttendanceRecord;
    onToggle: () => void;
    onExtraPress: () => void;
}

export function WorkerCard({ worker, attendance, onToggle, onExtraPress }: WorkerCardProps) {
    const isWorked = attendance.worked;
    const extra = attendance.extra;
    const hasExtra = !!extra;

    return (
        <View style={[styles.card, Shadows.card, !isWorked && styles.cardInactive]}>
            {/* Status stripe */}
            <View style={[styles.stripe, { backgroundColor: isWorked ? Colors.primary : Colors.slate300 }]} />

            <View style={styles.content}>
                {/* Top row */}
                <View style={styles.topRow}>
                    <View style={styles.nameSection}>
                        <View style={styles.nameRow}>
                            <Text style={styles.apodo}>{worker.apodo}</Text>
                            {worker.rol === 'maestro' && (
                                <MaterialIcons name="stars" size={20} color={Colors.primary} />
                            )}
                        </View>
                        <Text style={styles.tarifa}>
                            {formatMoney(worker.tarifa)}{' '}
                            <Text style={styles.tarifaSuffix}>/ día</Text>
                        </Text>
                    </View>

                    {/* Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                !isWorked && styles.toggleButtonActive,
                                !isWorked && { backgroundColor: Colors.danger },
                            ]}
                            onPress={onToggle}
                            activeOpacity={0.7}
                        >
                            {!isWorked && <MaterialIcons name="close" size={14} color={Colors.textInverse} />}
                            <Text
                                style={[
                                    styles.toggleText,
                                    !isWorked && styles.toggleTextActive,
                                ]}
                            >
                                NO
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                isWorked && styles.toggleButtonActive,
                                isWorked && { backgroundColor: Colors.primary },
                            ]}
                            onPress={onToggle}
                            activeOpacity={0.7}
                        >
                            {isWorked && <MaterialIcons name="check" size={14} color={Colors.textInverse} />}
                            <Text
                                style={[
                                    styles.toggleText,
                                    isWorked && styles.toggleTextActive,
                                ]}
                            >
                                SÍ
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom row */}
                <View style={styles.bottomRow}>
                    {hasExtra ? (
                        <View style={styles.extraBadge}>
                            <Text style={styles.extraBadgeText}>
                                + {formatMoney(extra.monto)} {extra.nota}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.statusContainer}>
                            <MaterialIcons
                                name={isWorked ? 'payments' : 'schedule'}
                                size={14}
                                color={isWorked ? Colors.success : Colors.textTertiary}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: isWorked ? Colors.success : Colors.textTertiary },
                                ]}
                            >
                                {isWorked ? 'Pagado' : 'Pendiente'}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.extraButton,
                            { backgroundColor: hasExtra ? Colors.primaryLighter : Colors.slate50 },
                        ]}
                        onPress={onExtraPress}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons
                            name={hasExtra ? 'edit' : 'add-circle-outline'}
                            size={20}
                            color={Colors.primary}
                        />
                        <Text style={styles.extraButtonText}>
                            {hasExtra ? 'Editar' : 'Extra'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        flexDirection: 'row',
    },
    cardInactive: {
        opacity: 0.9,
    },
    stripe: {
        width: 6,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.base,
    },
    nameSection: {},
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    apodo: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
    },
    tarifa: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    tarifaSuffix: {
        fontSize: 14,
        fontWeight: '400',
        color: Colors.textTertiary,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.slate100,
        borderRadius: BorderRadius.lg,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 8,
    },
    toggleButtonActive: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textTertiary,
        opacity: 0.5,
    },
    toggleTextActive: {
        color: Colors.textInverse,
        opacity: 1,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.md,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    extraBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    extraBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    extraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    extraButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
});
