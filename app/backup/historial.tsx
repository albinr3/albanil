import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
    fetchBackupHistory,
    getLocalBackupStatus,
    runDailySupabaseBackup,
    type BackupHistoryItem,
} from '../../src/backup/dailyBackup';
import { showToast } from '../../src/ui/toast';
import { BorderRadius, Colors, Shadows, Spacing } from '../../src/theme';

function formatDateTime(iso: string | null): string {
    if (!iso) return 'Sin datos';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '--';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
}

function backupReasonMessage(reason?: string): string {
    switch (reason) {
        case 'wifi_required':
            return 'Se necesita Wi-Fi para crear el backup.';
        case 'local_backup_only_wifi_required':
            return 'Se hizo backup local. Falta Wi-Fi para subir a Supabase.';
        case 'local_backup_only_missing_remote_config':
            return 'Se hizo backup local. Falta configurar Supabase en .env.';
        case 'local_backup_only_remote_already_done':
            return 'Se hizo backup local. El remoto ya estaba hecho hoy.';
        case 'missing_backup_config':
            return 'Faltan variables de Supabase en .env.';
        case 'already_backed_up_today':
            return 'Ya existe un backup exitoso hoy.';
        case 'local_backup_failed':
            return 'Falló el backup local en el dispositivo.';
        default:
            return reason || 'No se pudo completar el backup.';
    }
}

export default function BackupHistoryScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isRunningBackup, setIsRunningBackup] = useState(false);
    const [history, setHistory] = useState<BackupHistoryItem[]>([]);
    const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);
    const [lastSuccessPath, setLastSuccessPath] = useState<string | null>(null);
    const [lastRemoteSuccessAt, setLastRemoteSuccessAt] = useState<string | null>(null);
    const [lastRemoteSuccessPath, setLastRemoteSuccessPath] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [items, localStatus] = await Promise.all([
                fetchBackupHistory(40),
                getLocalBackupStatus(),
            ]);
            setHistory(items);
            setLastSuccessAt(localStatus.lastSuccessAt);
            setLastSuccessPath(localStatus.lastSuccessPath);
            setLastRemoteSuccessAt(localStatus.lastRemoteSuccessAt);
            setLastRemoteSuccessPath(localStatus.lastRemoteSuccessPath);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadData();
        }, [loadData])
    );

    const handleRunBackup = async () => {
        if (isRunningBackup) return;
        setIsRunningBackup(true);
        try {
            const result = await runDailySupabaseBackup({ force: true, requireWifi: true });
            if (result.status === 'success') {
                showToast({
                    type: 'success',
                    title: 'Backup completado',
                    message: 'La copia de seguridad fue subida correctamente.',
                });
            } else if (result.status === 'skipped') {
                showToast({
                    type: 'info',
                    title: 'Backup no ejecutado',
                    message: backupReasonMessage(result.reason),
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'Error en backup',
                    message: backupReasonMessage(result.reason),
                });
            }
            await loadData();
        } catch {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo ejecutar el backup.',
            });
        } finally {
            setIsRunningBackup(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color={Colors.slate700} />
                </Pressable>
                <Text style={styles.title}>Historial de Backups</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.summaryCard, Shadows.card]}>
                    <Text style={styles.summaryLabel}>Ultimo backup local</Text>
                    <Text style={styles.summaryValue}>{formatDateTime(lastSuccessAt)}</Text>
                    <Text style={styles.summaryPath} numberOfLines={2}>
                        {lastSuccessPath || 'Aun no hay backups locales registrados.'}
                    </Text>
                </View>

                <View style={[styles.summaryCard, Shadows.card]}>
                    <Text style={styles.summaryLabel}>Ultimo backup Supabase</Text>
                    <Text style={styles.summaryValue}>{formatDateTime(lastRemoteSuccessAt)}</Text>
                    <Text style={styles.summaryPath} numberOfLines={2}>
                        {lastRemoteSuccessPath || 'Aun no hay backups remotos registrados.'}
                    </Text>
                </View>

                <Pressable
                    style={[styles.runButton, Shadows.primaryButton, isRunningBackup && styles.runButtonDisabled]}
                    onPress={() => void handleRunBackup()}
                    disabled={isRunningBackup}
                >
                    <MaterialIcons name="cloud-upload" size={20} color={Colors.textInverse} />
                    <Text style={styles.runButtonText}>
                        {isRunningBackup ? 'Realizando backup...' : 'Realizar backup ahora'}
                    </Text>
                </Pressable>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Historial remoto</Text>
                    <Text style={styles.sectionCount}>{history.length}</Text>
                </View>

                <View style={styles.list}>
                    {!isLoading && history.length === 0 && (
                        <View style={[styles.emptyCard, Shadows.card]}>
                            <Text style={styles.emptyTitle}>Sin backups todavía</Text>
                            <Text style={styles.emptyText}>
                                Conéctate a Wi-Fi y usa "Realizar backup ahora".
                            </Text>
                        </View>
                    )}

                    {history.map((item) => (
                        <View key={item.path} style={[styles.itemCard, Shadows.card]}>
                            <View style={styles.itemTop}>
                                <Text style={styles.itemDate}>{item.dateKey}</Text>
                                <Text style={styles.itemSize}>{formatBytes(item.sizeBytes)}</Text>
                            </View>
                            <Text style={styles.itemFile} numberOfLines={1}>
                                {item.fileName}
                            </Text>
                            <Text style={styles.itemMeta}>{formatDateTime(item.createdAt)}</Text>
                        </View>
                    ))}
                </View>
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
        paddingVertical: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.base,
        gap: Spacing.base,
    },
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: Spacing.base,
        gap: 6,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    summaryPath: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    runButton: {
        minHeight: 50,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    runButtonDisabled: {
        opacity: 0.6,
    },
    runButtonText: {
        color: Colors.textInverse,
        fontSize: 16,
        fontWeight: '700',
    },
    sectionHeader: {
        marginTop: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    sectionCount: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    list: {
        gap: 10,
    },
    emptyCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: Spacing.base,
        gap: 4,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    emptyText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    itemCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: Spacing.base,
        gap: 4,
    },
    itemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemDate: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    itemSize: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    itemFile: {
        fontSize: 13,
        color: Colors.primary,
    },
    itemMeta: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
});
