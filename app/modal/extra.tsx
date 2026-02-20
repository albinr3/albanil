import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Pressable,
    Keyboard,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';

const PRESETS = [
    { label: 'Bono pequeño', monto: 100 },
    { label: 'Dieta', monto: 200 },
    { label: 'Medio día', monto: 500, popular: true },
    { label: 'Día completo', monto: 1000 },
];

export default function ExtraModal() {
    const router = useRouter();
    const params = useLocalSearchParams<{ workerId: string; workerName: string; date?: string }>();
    const { setExtra, setExtraByDate, getAttendance, getAttendanceByDate } = useAppStore();
    const amountInputRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);

    const currentExtra = useMemo(() => {
        if (!params.workerId) return undefined;
        const attendance = params.date
            ? getAttendanceByDate(params.workerId, params.date)
            : getAttendance(params.workerId);
        return attendance.extra;
    }, [getAttendance, getAttendanceByDate, params.date, params.workerId]);

    const initialPresetIndex = useMemo(() => {
        if (!currentExtra) return 2;
        return PRESETS.findIndex((preset) => preset.monto === currentExtra.monto);
    }, [currentExtra]);

    const [selectedPreset, setSelectedPreset] = useState<number | null>(
        initialPresetIndex >= 0 ? initialPresetIndex : null
    );
    const [customAmount, setCustomAmount] = useState(currentExtra ? String(currentExtra.monto) : '500');
    const [nota, setNota] = useState(currentExtra?.nota ?? '');
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = Keyboard.addListener(showEvent, (event) => {
            setKeyboardOffset(event.endCoordinates.height);
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        });
        const onHide = Keyboard.addListener(hideEvent, () => setKeyboardOffset(0));

        return () => {
            onShow.remove();
            onHide.remove();
        };
    }, []);

    const handlePresetSelect = (index: number) => {
        setSelectedPreset(index);
        setCustomAmount(PRESETS[index].monto.toString());
    };

    const handleSave = () => {
        if (!params.workerId) {
            router.back();
            return;
        }

        const parsedAmount = Number.parseInt(customAmount, 10);
        const monto = Number.isFinite(parsedAmount) ? parsedAmount : 0;

        if (monto <= 0) {
            if (params.date) {
                setExtraByDate(params.workerId, params.date, undefined);
            } else {
                setExtra(params.workerId, undefined);
            }
            router.back();
            return;
        }

        const preset = selectedPreset !== null ? PRESETS[selectedPreset] : null;
        const extra = {
            monto,
            nota: nota || preset?.label || 'Extra',
        };

        if (params.date) {
            setExtraByDate(params.workerId, params.date, extra);
        } else {
            setExtra(params.workerId, extra);
        }

        router.back();
    };

    return (
        <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={[styles.sheetWrap, { paddingBottom: keyboardOffset }]}>
                <View style={styles.sheet}>
                {/* Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Agregar extra</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        keyboardOffset > 0 && styles.scrollContentKeyboard,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Quick Amount Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>MONTO RÁPIDO</Text>
                        <View style={styles.presetGrid}>
                            {PRESETS.map((preset, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.presetButton,
                                        selectedPreset === index && styles.presetButtonActive,
                                    ]}
                                    onPress={() => handlePresetSelect(index)}
                                >
                                    {preset.popular && selectedPreset === index && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                                        </View>
                                    )}
                                    <Text
                                        style={[
                                            styles.presetLabel,
                                            selectedPreset === index && styles.presetLabelActive,
                                        ]}
                                    >
                                        {preset.label}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.presetAmount,
                                            selectedPreset === index && styles.presetAmountActive,
                                        ]}
                                    >
                                        +RD${preset.monto.toLocaleString()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Other amount toggle */}
                        <TouchableOpacity
                            style={styles.otherButton}
                            onPress={() => {
                                setSelectedPreset(null);
                                requestAnimationFrame(() => {
                                    amountInputRef.current?.focus();
                                    scrollRef.current?.scrollToEnd({ animated: true });
                                });
                            }}
                        >
                            <MaterialIcons name="edit" size={16} color={Colors.primary} />
                            <Text style={styles.otherButtonText}>Otro monto</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.section}>
                        <Text style={styles.inputLabel}>Monto Total</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.amountPrefix}>RD$</Text>
                            <TextInput
                                ref={amountInputRef}
                                style={styles.amountInput}
                                value={customAmount}
                                onChangeText={(t) => {
                                    setCustomAmount(t);
                                    setSelectedPreset(null);
                                }}
                                onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor={Colors.slate300}
                            />
                            <Text style={styles.amountSuffix}>DOP</Text>
                        </View>
                    </View>

                    {/* Note */}
                    <View style={styles.section}>
                        <Text style={styles.inputLabel}>
                            Nota <Text style={styles.inputLabelOptional}>(opcional)</Text>
                        </Text>
                        <TextInput
                            style={styles.noteInput}
                            value={nota}
                            onChangeText={setNota}
                            placeholder="Ej. Pasaje, almuerzo, horas extra..."
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>

                {/* Footer CTA */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, Shadows.primaryButton]}
                        onPress={handleSave}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="save" size={22} color={Colors.textInverse} />
                        <Text style={styles.saveButtonText}>Guardar Extra</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetWrap: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    handle: {
        width: 48,
        height: 6,
        backgroundColor: Colors.slate300,
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.slate100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        maxHeight: 400,
    },
    scrollContent: {
        padding: Spacing.xl,
        gap: 24,
    },
    scrollContentKeyboard: {
        paddingBottom: Spacing['4xl'],
    },
    section: {},
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    presetButton: {
        width: '47%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        position: 'relative',
    },
    presetButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Shadows.primaryButton,
    },
    popularBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#facc15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    popularBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#713f12',
    },
    presetLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    presetLabelActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    presetAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    presetAmountActive: {
        color: Colors.textInverse,
    },
    otherButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 12,
        backgroundColor: Colors.primaryLight,
        borderRadius: 8,
    },
    otherButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.slate700,
        marginBottom: 8,
    },
    inputLabelOptional: {
        fontWeight: '400',
        color: Colors.textTertiary,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 16,
    },
    amountPrefix: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    amountSuffix: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    noteInput: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        padding: 12,
        fontSize: 16,
        color: Colors.text,
        minHeight: 80,
    },
    footer: {
        padding: Spacing.xl,
        paddingBottom: Spacing['3xl'],
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
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
        fontSize: 18,
        fontWeight: '700',
    },
});
