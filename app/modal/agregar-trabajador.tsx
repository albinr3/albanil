import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/AppContext';
import { Avatar } from '../../src/components/Avatar';
import { BorderRadius, Colors, Shadows, Spacing } from '../../src/theme';

export default function AgregarTrabajadorModal() {
    const router = useRouter();
    const { workers, addWorkerToWeek } = useAppStore();
    const availableWorkers = workers.filter((worker) => !worker.activo);

    const handleSelectWorker = (workerId: string) => {
        addWorkerToWeek(workerId);
        router.back();
    };

    return (
        <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={styles.sheet}>
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Agregar a esta semana</Text>
                        <Text style={styles.subtitle}>Selecciona un trabajador ya creado</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {availableWorkers.length > 0 ? (
                        availableWorkers.map((worker) => (
                            <TouchableOpacity
                                key={worker.id}
                                style={[styles.workerItem, Shadows.card]}
                                onPress={() => handleSelectWorker(worker.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.workerLeft}>
                                    <Avatar iniciales={worker.iniciales} colorIndex={worker.avatarColorIndex} size={44} />
                                    <View>
                                        <Text style={styles.workerName}>{worker.apodo}</Text>
                                        <Text style={styles.workerMeta}>
                                            {worker.tipo === 'fijo' ? 'Fijo' : 'Por dias'} - RD${worker.tarifa.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialIcons name="add-circle" size={24} color={Colors.primary} />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="group-off" size={40} color={Colors.slate300} />
                            <Text style={styles.emptyTitle}>No hay trabajadores disponibles</Text>
                            <Text style={styles.emptyText}>Todos los trabajadores ya estan en la semana actual.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
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
        maxHeight: '88%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    handle: {
        width: 48,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.slate300,
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
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    subtitle: {
        marginTop: 2,
        fontSize: 13,
        color: Colors.textSecondary,
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
        maxHeight: 430,
    },
    scrollContent: {
        padding: Spacing.xl,
        gap: 10,
    },
    workerItem: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        backgroundColor: Colors.background,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    workerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    workerName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
    },
    workerMeta: {
        marginTop: 2,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 36,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
