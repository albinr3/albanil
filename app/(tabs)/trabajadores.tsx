import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Avatar } from '../../src/components/Avatar';
import { Chip } from '../../src/components/Chip';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { formatMoney } from '../../src/utils';

type FilterType = 'todos' | 'activos' | 'inactivos';

export default function TrabajadoresScreen() {
    const router = useRouter();
    const { workers } = useAppStore();
    const [filter, setFilter] = useState<FilterType>('todos');
    const [search, setSearch] = useState('');

    const filteredWorkers = workers.filter((w) => {
        const matchesFilter =
            filter === 'todos' ||
            (filter === 'activos' && w.activo) ||
            (filter === 'inactivos' && !w.activo);
        const matchesSearch =
            !search || w.apodo.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Trabajadores</Text>
                    <View style={styles.headerIcon}>
                        <MaterialIcons name="construction" size={24} color={Colors.primary} />
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={22} color={Colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por apodo..."
                        placeholderTextColor={Colors.textTertiary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    <View style={styles.filterRow}>
                        {(['todos', 'activos', 'inactivos'] as FilterType[]).map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterChip,
                                    filter === f && styles.filterChipActive,
                                ]}
                                onPress={() => setFilter(f)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        filter === f && styles.filterChipTextActive,
                                    ]}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Worker Cards */}
                <View style={styles.workerList}>
                    {filteredWorkers.map((worker) => (
                        <TouchableOpacity
                            key={worker.id}
                            style={[
                                styles.workerCard,
                                Shadows.card,
                                !worker.activo && styles.workerCardInactive,
                            ]}
                            onPress={() => router.push(`/trabajador/${worker.id}`)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.workerCardTop}>
                                <View style={styles.workerCardLeft}>
                                    <Avatar
                                        iniciales={worker.iniciales}
                                        colorIndex={worker.avatarColorIndex}
                                        size={56}
                                        inactive={!worker.activo}
                                    />
                                    <View>
                                        <Text style={[styles.workerName, !worker.activo && styles.workerNameInactive]}>
                                            {worker.apodo}
                                        </Text>
                                        <Chip
                                            label={worker.activo ? 'Activo' : 'Inactivo'}
                                            variant={worker.activo ? 'success' : 'neutral'}
                                            small
                                        />
                                    </View>
                                </View>
                                <View style={styles.workerCardRight}>
                                    <Text style={styles.tarifaLabel}>TARIFA</Text>
                                    <Text style={[styles.tarifaValue, !worker.activo && styles.tarifaValueInactive]}>
                                        {formatMoney(worker.tarifa)}
                                        <Text style={styles.tarifaSuffix}> / día</Text>
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.workerCardBottom}>
                                <View style={styles.tipoBadge}>
                                    <MaterialIcons
                                        name={worker.tipo === 'fijo' ? 'badge' : 'calendar-today'}
                                        size={16}
                                        color={worker.tipo === 'fijo' ? Colors.primary : Colors.slate600}
                                    />
                                    <Text
                                        style={[
                                            styles.tipoText,
                                            { color: worker.tipo === 'fijo' ? Colors.primary : Colors.slate600 },
                                        ]}
                                    >
                                        {worker.tipo === 'fijo' ? 'Fijo' : 'Por días'}
                                    </Text>
                                </View>
                                <View style={styles.workerCardActions}>
                                    <TouchableOpacity style={styles.actionBtn}>
                                        <MaterialIcons name="visibility" size={22} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    {!worker.activo && (
                                        <TouchableOpacity style={styles.actionBtn}>
                                            <MaterialIcons
                                                name="block"
                                                size={22}
                                                color={Colors.danger}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* FAB - Add Worker */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, Shadows.primaryButton]}
                    onPress={() => router.push('/trabajador/nuevo')}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="add" size={28} color={Colors.textInverse} />
                    <Text style={styles.fabText}>Agregar trabajador</Text>
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
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.base,
        paddingBottom: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13, 108, 242, 0.1)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.base,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.text,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.xl,
    },
    filterScroll: {
        marginBottom: Spacing.base,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Shadows.primaryButton,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.slate600,
    },
    filterChipTextActive: {
        color: Colors.textInverse,
        fontWeight: '600',
    },
    workerList: {
        gap: 16,
    },
    workerCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    workerCardInactive: {
        backgroundColor: Colors.slate50,
        opacity: 0.8,
    },
    workerCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    workerCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    workerName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    workerNameInactive: {
        color: Colors.textSecondary,
    },
    workerCardRight: {
        alignItems: 'flex-end',
    },
    tarifaLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    tarifaValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    tarifaValueInactive: {
        color: Colors.textSecondary,
    },
    tarifaSuffix: {
        fontSize: 14,
        fontWeight: '400',
        color: Colors.textSecondary,
    },
    workerCardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.base,
        marginTop: Spacing.base,
    },
    tipoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tipoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    workerCardActions: {
        flexDirection: 'row',
        gap: 4,
    },
    actionBtn: {
        padding: 10,
        borderRadius: 8,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    fabText: {
        color: Colors.textInverse,
        fontSize: 18,
        fontWeight: '700',
    },
});
