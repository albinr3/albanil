import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from '../db/client';

type BackupStatus = 'success' | 'skipped' | 'error';

export interface DailyBackupResult {
    status: BackupStatus;
    reason?: string;
    path?: string;
    localPath?: string;
    remotePath?: string;
    debug?: string;
}

interface RunBackupOptions {
    force?: boolean;
    requireWifi?: boolean;
}

export interface BackupLocalStatus {
    lastSuccessDate: string | null;
    lastSuccessAt: string | null;
    lastSuccessPath: string | null;
    lastRemoteSuccessDate: string | null;
    lastRemoteSuccessAt: string | null;
    lastRemoteSuccessPath: string | null;
}

export interface BackupHistoryItem {
    path: string;
    dateKey: string;
    fileName: string;
    sizeBytes: number;
    createdAt: string | null;
}

interface BackupConfig {
    url: string;
    anonKey: string;
    bucket: string;
    projectId: string;
}

interface BackupSnapshot {
    generatedAtIso: string;
    appVersion: string;
    projectId: string;
    installationId: string;
    tables: {
        workers: Record<string, unknown>[];
        attendance: Record<string, unknown>[];
        advances: Record<string, unknown>[];
        payroll_weeks: Record<string, unknown>[];
        payroll_entries: Record<string, unknown>[];
    };
}

const META_INSTALLATION_ID = 'backup.installation_id';
const META_LOCAL_LAST_SUCCESS_DATE = 'backup.local.last_success_date';
const META_LOCAL_LAST_SUCCESS_PATH = 'backup.local.last_success_path';
const META_LOCAL_LAST_SUCCESS_AT = 'backup.local.last_success_at';
const META_REMOTE_LAST_SUCCESS_DATE = 'backup.remote.last_success_date';
const META_REMOTE_LAST_SUCCESS_PATH = 'backup.remote.last_success_path';
const META_REMOTE_LAST_SUCCESS_AT = 'backup.remote.last_success_at';

function getLocalBackupRoot(): string | null {
    if (!FileSystem.documentDirectory) return null;
    return `${FileSystem.documentDirectory}backups`;
}

function getLocalDateKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function randomId(length = 10): string {
    return Math.random().toString(36).slice(2, 2 + length);
}

function resolveConfig(): BackupConfig | null {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
    const bucket = process.env.EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET?.trim() ?? '';
    const projectId = process.env.EXPO_PUBLIC_BACKUP_PROJECT_ID?.trim() ?? 'default';

    if (!url || !anonKey || !bucket) {
        return null;
    }

    return { url, anonKey, bucket, projectId };
}

async function hasWifiConnection(): Promise<boolean> {
    const network = await getNetworkStateAsync();
    return network.isConnected === true && network.type === NetworkStateType.WIFI;
}

async function getNetworkDebugLabel(): Promise<string> {
    const network = await getNetworkStateAsync();
    const type = String(network.type ?? 'unknown');
    const connected = String(network.isConnected ?? false);
    const reachable = String((network as { isInternetReachable?: boolean }).isInternetReachable ?? 'unknown');
    return `type=${type},connected=${connected},internetReachable=${reachable}`;
}

function getSupabaseClient(config: BackupConfig) {
    return createClient(config.url, config.anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
}

function toErrorDetail(error: unknown): string {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error);
    } catch {
        return 'unknown_error';
    }
}

async function getMetaValue(key: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
        `
        SELECT value
        FROM app_meta
        WHERE key = ?
        LIMIT 1
    `,
        key
    );
    return row?.value ?? null;
}

async function setMetaValue(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `
        INSERT INTO app_meta (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
        key,
        value
    );
}

async function getOrCreateInstallationId(): Promise<string> {
    const existing = await getMetaValue(META_INSTALLATION_ID);
    if (existing) return existing;
    const created = `ins-${Date.now()}-${randomId(8)}`;
    await setMetaValue(META_INSTALLATION_ID, created);
    return created;
}

async function readTableRows(tableName: string): Promise<Record<string, unknown>[]> {
    const db = await getDb();
    return db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${tableName}`);
}

async function buildSnapshot(projectId: string, installationId: string): Promise<BackupSnapshot> {
    const appVersion = Constants.expoConfig?.version ?? '0.0.0';
    const [workers, attendance, advances, payrollWeeks, payrollEntries] = await Promise.all([
        readTableRows('workers'),
        readTableRows('attendance'),
        readTableRows('advances'),
        readTableRows('payroll_weeks'),
        readTableRows('payroll_entries'),
    ]);

    return {
        generatedAtIso: new Date().toISOString(),
        appVersion,
        projectId,
        installationId,
        tables: {
            workers,
            attendance,
            advances,
            payroll_weeks: payrollWeeks,
            payroll_entries: payrollEntries,
        },
    };
}

async function ensureDir(uri: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
    }
}

async function saveLocalBackup(params: {
    projectId: string;
    installationId: string;
    today: string;
    payload: string;
}): Promise<string> {
    const root = getLocalBackupRoot();
    if (!root) {
        throw new Error('local_backup_root_unavailable');
    }
    const folder = `${root}/${params.projectId}/${params.installationId}/${params.today}`;
    await ensureDir(folder);
    const fileName = `${Date.now()}-${randomId(6)}.json`;
    const fileUri = `${folder}/${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, params.payload, {
        encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
}

export async function runDailySupabaseBackup(options?: RunBackupOptions): Promise<DailyBackupResult> {
    const config = resolveConfig();
    const force = options?.force ?? false;
    const today = getLocalDateKey();
    const installationId = await getOrCreateInstallationId();

    let payload: string | null = null;
    let localPath: string | undefined;
    const localLastSuccessDate = await getMetaValue(META_LOCAL_LAST_SUCCESS_DATE);
    const shouldCreateLocal = force || localLastSuccessDate !== today;
    if (shouldCreateLocal) {
        const snapshot = await buildSnapshot(config?.projectId ?? 'default', installationId);
        payload = JSON.stringify(snapshot);
        try {
            localPath = await saveLocalBackup({
                projectId: config?.projectId ?? 'default',
                installationId,
                today,
                payload,
            });
            await Promise.all([
                setMetaValue(META_LOCAL_LAST_SUCCESS_DATE, today),
                setMetaValue(META_LOCAL_LAST_SUCCESS_PATH, localPath),
                setMetaValue(META_LOCAL_LAST_SUCCESS_AT, new Date().toISOString()),
            ]);
        } catch (error) {
            return {
                status: 'error',
                reason: 'local_backup_failed',
                debug: toErrorDetail(error),
            };
        }
    } else {
        localPath = (await getMetaValue(META_LOCAL_LAST_SUCCESS_PATH)) ?? undefined;
    }

    if (!config) {
        return {
            status: localPath ? 'success' : 'skipped',
            reason: localPath ? 'local_backup_only_missing_remote_config' : 'missing_backup_config',
            localPath,
            path: localPath,
            debug: 'missing EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY/EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET',
        };
    }

    const requireWifi = options?.requireWifi ?? true;
    if (requireWifi) {
        const wifiConnected = await hasWifiConnection();
        if (!wifiConnected) {
            return {
                status: localPath ? 'success' : 'skipped',
                reason: localPath ? 'local_backup_only_wifi_required' : 'wifi_required',
                localPath,
                path: localPath,
                debug: await getNetworkDebugLabel(),
            };
        }
    }

    const remoteLastSuccessDate = await getMetaValue(META_REMOTE_LAST_SUCCESS_DATE);
    if (!force && remoteLastSuccessDate === today) {
        return {
            status: localPath ? 'success' : 'skipped',
            reason: localPath ? 'local_backup_only_remote_already_done' : 'already_backed_up_today',
            localPath,
            path: localPath,
        };
    }

    if (!payload) {
        const snapshot = await buildSnapshot(config.projectId, installationId);
        payload = JSON.stringify(snapshot);
    }

    const fileName = `${Date.now()}-${randomId(6)}.json`;
    const path = `${config.projectId}/${installationId}/${today}/${fileName}`;
    const fileBytes = new TextEncoder().encode(payload);

    const supabase = getSupabaseClient(config);
    const target = `host=${config.url},bucket=${config.bucket},project=${config.projectId}`;

    try {
        const { error } = await supabase.storage
            .from(config.bucket)
            .upload(path, fileBytes, { contentType: 'application/json', upsert: false });

        if (error) {
            return {
                status: 'error',
                reason: error.message,
                localPath,
                path: localPath,
                debug: `${target},network=${await getNetworkDebugLabel()}`,
            };
        }
    } catch (error) {
        return {
            status: 'error',
            reason: 'network_or_transport_error',
            localPath,
            path: localPath,
            debug: `${target},network=${await getNetworkDebugLabel()},error=${toErrorDetail(error)}`,
        };
    }

    await Promise.all([
        setMetaValue(META_REMOTE_LAST_SUCCESS_DATE, today),
        setMetaValue(META_REMOTE_LAST_SUCCESS_PATH, path),
        setMetaValue(META_REMOTE_LAST_SUCCESS_AT, new Date().toISOString()),
    ]);

    return { status: 'success', path, localPath, remotePath: path, debug: `${target}` };
}

export async function getLocalBackupStatus(): Promise<BackupLocalStatus> {
    const [
        lastSuccessDate,
        lastSuccessAt,
        lastSuccessPath,
        lastRemoteSuccessDate,
        lastRemoteSuccessAt,
        lastRemoteSuccessPath,
    ] = await Promise.all([
        getMetaValue(META_LOCAL_LAST_SUCCESS_DATE),
        getMetaValue(META_LOCAL_LAST_SUCCESS_AT),
        getMetaValue(META_LOCAL_LAST_SUCCESS_PATH),
        getMetaValue(META_REMOTE_LAST_SUCCESS_DATE),
        getMetaValue(META_REMOTE_LAST_SUCCESS_AT),
        getMetaValue(META_REMOTE_LAST_SUCCESS_PATH),
    ]);
    return {
        lastSuccessDate,
        lastSuccessAt,
        lastSuccessPath,
        lastRemoteSuccessDate,
        lastRemoteSuccessAt,
        lastRemoteSuccessPath,
    };
}

function toBackupHistoryItem(
    projectId: string,
    installationId: string,
    dateKey: string,
    file: { name: string; metadata?: { size?: number }; created_at?: string | null }
): BackupHistoryItem {
    return {
        path: `${projectId}/${installationId}/${dateKey}/${file.name}`,
        dateKey,
        fileName: file.name,
        sizeBytes: Number(file.metadata?.size ?? 0),
        createdAt: file.created_at ?? null,
    };
}

export async function fetchBackupHistory(limit = 30): Promise<BackupHistoryItem[]> {
    const config = resolveConfig();
    if (!config) {
        return [];
    }

    const installationId = await getMetaValue(META_INSTALLATION_ID);
    if (!installationId) {
        return [];
    }

    const supabase = getSupabaseClient(config);
    const basePath = `${config.projectId}/${installationId}`;
    const { data: dateFolders, error: folderError } = await supabase.storage
        .from(config.bucket)
        .list(basePath, { limit: 120, sortBy: { column: 'name', order: 'desc' } });

    if (folderError || !dateFolders?.length) {
        return [];
    }

    const history: BackupHistoryItem[] = [];
    for (const folder of dateFolders) {
        if (!folder.name) continue;
        const dateKey = folder.name;
        const folderPath = `${basePath}/${dateKey}`;
        const { data: files } = await supabase.storage
            .from(config.bucket)
            .list(folderPath, { limit: 60, sortBy: { column: 'name', order: 'desc' } });

        if (!files?.length) continue;
        for (const file of files) {
            if (!file.name?.endsWith('.json')) continue;
            history.push(toBackupHistoryItem(config.projectId, installationId, dateKey, file));
            if (history.length >= limit) {
                return history;
            }
        }
    }

    return history;
}
