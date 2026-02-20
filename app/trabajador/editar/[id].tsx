import React, { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../../src/store/AppContext';
import { BorderRadius, Colors, Shadows, Spacing } from '../../../src/theme';
import { SCREEN_SAFE_AREA_EDGES, useStickyFooterLayout } from '../../../src/ui/safeArea';

type TipoTrabajador = 'fijo' | 'por_dias';

export default function EditarTrabajadorScreen() {
    const router = useRouter();
    const { scrollContentPaddingBottom, footerPaddingBottom } = useStickyFooterLayout(148, 12);
    const { id } = useLocalSearchParams<{ id: string }>();
    const { workers, updateWorker } = useAppStore();
    const worker = workers.find((w) => w.id === id);

    const [apodo, setApodo] = useState(worker?.apodo ?? '');
    const [nombreCompleto, setNombreCompleto] = useState(worker?.nombreCompleto ?? '');
    const [tarifaRaw, setTarifaRaw] = useState(worker ? String(worker.tarifa) : '');
    const [tipo, setTipo] = useState<TipoTrabajador>(worker?.tipo ?? 'fijo');

    const tarifa = useMemo(() => Number(tarifaRaw.replace(',', '.')), [tarifaRaw]);
    const canSave = !!worker && apodo.trim().length > 0 && Number.isFinite(tarifa) && tarifa > 0;

    if (!worker) {
        return (
            <SafeAreaView style={styles.safeArea} edges={SCREEN_SAFE_AREA_EDGES}>
                <View style={styles.notFound}>
                    <Text style={styles.notFoundText}>Trabajador no encontrado.</Text>
                    <TouchableOpacity style={styles.backSimple} onPress={() => router.back()}>
                        <Text style={styles.backSimpleText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleSave = () => {
        if (!canSave) return;
        updateWorker({
            id: worker.id,
            apodo,
            nombreCompleto,
            tarifa,
            tipo,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={SCREEN_SAFE_AREA_EDGES}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="arrow-back" size={24} color={Colors.slate900} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Editar Trabajador</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={styles.overline}>Identificador Principal</Text>
                        <Text style={styles.sectionTitle}>Apodo</Text>
                        <TextInput
                            style={styles.mainInput}
                            placeholder="Ej. El Maestro, Junior, Electrico"
                            placeholderTextColor={Colors.slate400}
                            value={apodo}
                            onChangeText={setApodo}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Nombre completo (Opcional)</Text>
                        <TextInput
                            style={styles.secondaryInput}
                            placeholder="Nombre y apellidos"
                            placeholderTextColor={Colors.slate400}
                            value={nombreCompleto}
                            onChangeText={setNombreCompleto}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Tarifa por dia</Text>
                        <View style={styles.moneyInputWrap}>
                            <Text style={styles.prefix}>RD$</Text>
                            <TextInput
                                style={styles.moneyInput}
                                placeholder="0.00"
                                placeholderTextColor={Colors.slate400}
                                keyboardType="decimal-pad"
                                value={tarifaRaw}
                                onChangeText={setTarifaRaw}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Tipo de trabajador</Text>
                        <View style={styles.typeGrid}>
                            <Pressable
                                style={[styles.typeCard, tipo === 'fijo' && styles.typeCardActive]}
                                onPress={() => setTipo('fijo')}
                            >
                                <MaterialIcons
                                    name="calendar-today"
                                    size={30}
                                    color={tipo === 'fijo' ? Colors.primary : Colors.slate400}
                                />
                                <Text style={styles.typeTitle}>Fijo</Text>
                                <Text style={styles.typeSubtitle}>Sueldo recurrente</Text>
                                {tipo === 'fijo' && (
                                    <MaterialIcons name="check-circle" size={20} color={Colors.primary} style={styles.checkIcon} />
                                )}
                            </Pressable>

                            <Pressable
                                style={[styles.typeCard, tipo === 'por_dias' && styles.typeCardActive]}
                                onPress={() => setTipo('por_dias')}
                            >
                                <MaterialIcons
                                    name="timer"
                                    size={30}
                                    color={tipo === 'por_dias' ? Colors.primary : Colors.slate400}
                                />
                                <Text style={styles.typeTitle}>Por dias</Text>
                                <Text style={styles.typeSubtitle}>Pago por jornada</Text>
                                {tipo === 'por_dias' && (
                                    <MaterialIcons name="check-circle" size={20} color={Colors.primary} style={styles.checkIcon} />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled, Shadows.primaryButton]}
                        onPress={handleSave}
                        disabled={!canSave}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="save" size={22} color={Colors.textInverse} />
                        <Text style={styles.saveText}>Guardar Cambios</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 20,
    },
    notFoundText: {
        fontSize: 16,
        color: Colors.text,
    },
    backSimple: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
    },
    backSimpleText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    header: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        padding: 8,
        borderRadius: BorderRadius.full,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.slate900,
        letterSpacing: -0.4,
    },
    headerSpacer: {
        width: 40,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        maxWidth: 520,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.xl,
        gap: Spacing.xl,
    },
    section: {
        gap: 8,
    },
    overline: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.slate900,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.slate600,
    },
    mainInput: {
        height: 64,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.slate200,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.base,
        fontSize: 20,
        fontWeight: '600',
        color: Colors.slate900,
    },
    secondaryInput: {
        marginTop: 4,
        height: 56,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.slate200,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.base,
        fontSize: 16,
        color: Colors.slate900,
    },
    moneyInputWrap: {
        marginTop: 4,
        position: 'relative',
        justifyContent: 'center',
    },
    prefix: {
        position: 'absolute',
        left: Spacing.base,
        zIndex: 1,
        fontSize: 22,
        fontWeight: '700',
        color: Colors.slate500,
    },
    moneyInput: {
        height: 64,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.slate200,
        backgroundColor: Colors.surface,
        paddingLeft: 56,
        paddingRight: Spacing.base,
        fontSize: 24,
        fontWeight: '800',
        color: Colors.slate900,
    },
    typeGrid: {
        marginTop: 4,
        flexDirection: 'row',
        gap: 12,
    },
    typeCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.slate200,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 132,
    },
    typeCardActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLighter,
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    typeTitle: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.slate900,
    },
    typeSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: Colors.slate500,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: Spacing.base,
        paddingTop: 12,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xl,
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveText: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textInverse,
    },
});
