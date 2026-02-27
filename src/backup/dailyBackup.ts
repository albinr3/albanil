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
    source: 'remote' | 'local';
    path: string;
    dateKey: string;
    fileName: string;
    sizeBytes: number;
    createdAt: string | null;
}

export interface RestoreBackupResult {
    status: BackupStatus;
    reason?: string;
    restoredPath?: string;
    debug?: string;
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

type SnapshotTableName = keyof BackupSnapshot['tables'];

const SNAPSHOT_DELETE_ORDER: SnapshotTableName[] = [
    'payroll_entries',
    'attendance',
    'advances',
    'payroll_weeks',
    'workers',
];

const SNAPSHOT_INSERT_ORDER: SnapshotTableName[] = [
    'workers',
    'attendance',
    'advances',
    'payroll_weeks',
    'payroll_entries',
];

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

function getLocalProjectId(): string {
    return resolveConfig()?.projectId ?? 'default';
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSqliteValue(value: unknown): string | number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return JSON.stringify(value);
}

function parseBackupSnapshot(payload: string): BackupSnapshot {
    const parsed = JSON.parse(payload) as unknown;
    if (!isRecord(parsed)) {
        throw new Error('invalid_backup_payload');
    }

    const tables = parsed.tables;
    if (!isRecord(tables)) {
        throw new Error('invalid_backup_tables');
    }

    const requiredTables: SnapshotTableName[] = [
        'workers',
        'attendance',
        'advances',
        'payroll_weeks',
        'payroll_entries',
    ];

    for (const tableName of requiredTables) {
        if (!Array.isArray(tables[tableName])) {
            throw new Error(`invalid_backup_table_${tableName}`);
        }
    }

    return parsed as unknown as BackupSnapshot;
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

async function getTableColumnNames(
    db: Awaited<ReturnType<typeof getDb>>,
    tableName: SnapshotTableName
): Promise<Set<string>> {
    const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
    return new Set(rows.map((row) => row.name));
}

async function insertSnapshotRows(
    db: Awaited<ReturnType<typeof getDb>>,
    tableName: SnapshotTableName,
    rows: Record<string, unknown>[],
    allowedColumns: Set<string>
): Promise<void> {
    if (!rows.length) return;

    for (const row of rows) {
        const entries = Object.entries(row).filter(([key]) => allowedColumns.has(key));
        if (!entries.length) continue;

        const columns = entries.map(([key]) => key);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        const values = entries.map(([, value]) => toSqliteValue(value));
        await db.runAsync(sql, ...values);
    }
}

async function applyBackupSnapshot(snapshot: BackupSnapshot): Promise<void> {
    const db = await getDb();
    const columnMapEntries = await Promise.all(
        (Object.keys(snapshot.tables) as SnapshotTableName[]).map(async (tableName) => [
            tableName,
            await getTableColumnNames(db, tableName),
        ] as const)
    );
    const columnMap = new Map<SnapshotTableName, Set<string>>(columnMapEntries);

    await db.withTransactionAsync(async () => {
        for (const tableName of SNAPSHOT_DELETE_ORDER) {
            await db.runAsync(`DELETE FROM ${tableName}`);
        }

        for (const tableName of SNAPSHOT_INSERT_ORDER) {
            const rows = snapshot.tables[tableName];
            await insertSnapshotRows(db, tableName, rows, columnMap.get(tableName) ?? new Set());
        }
    });
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
        source: 'remote',
        path: `${projectId}/${installationId}/${dateKey}/${file.name}`,
        dateKey,
        fileName: file.name,
        sizeBytes: Number(file.metadata?.size ?? 0),
        createdAt: file.created_at ?? null,
    };
}

function toLocalBackupHistoryItem(params: {
    fileUri: string;
    dateKey: string;
    fileName: string;
    sizeBytes: number;
    modificationTime?: number | null;
}): BackupHistoryItem {
    return {
        source: 'local',
        path: params.fileUri,
        dateKey: params.dateKey,
        fileName: params.fileName,
        sizeBytes: params.sizeBytes,
        createdAt:
            typeof params.modificationTime === 'number'
                ? new Date(params.modificationTime * 1000).toISOString()
                : null,
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

export async function fetchLocalBackupHistory(limit = 30): Promise<BackupHistoryItem[]> {
    const root = getLocalBackupRoot();
    if (!root) return [];

    const installationId = await getMetaValue(META_INSTALLATION_ID);
    if (!installationId) return [];

    const projectId = getLocalProjectId();
    const basePath = `${root}/${projectId}/${installationId}`;
    const baseInfo = await FileSystem.getInfoAsync(basePath);
    if (!baseInfo.exists) return [];

    const dateFolders = (await FileSystem.readDirectoryAsync(basePath)).sort((a, b) => b.localeCompare(a));
    const history: BackupHistoryItem[] = [];

    for (const dateKey of dateFolders) {
        const folderPath = `${basePath}/${dateKey}`;
        const folderInfo = await FileSystem.getInfoAsync(folderPath);
        if (!folderInfo.exists) continue;

        const files = (await FileSystem.readDirectoryAsync(folderPath))
            .filter((name) => name.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a));

        for (const fileName of files) {
            const fileUri = `${folderPath}/${fileName}`;
            const info = await FileSystem.getInfoAsync(fileUri);
            if (!info.exists) continue;

            history.push(
                toLocalBackupHistoryItem({
                    fileUri,
                    dateKey,
                    fileName,
                    sizeBytes: Number(('size' in info ? info.size : 0) ?? 0),
                    modificationTime:
                        'modificationTime' in info && typeof info.modificationTime === 'number'
                            ? info.modificationTime
                            : null,
                })
            );

            if (history.length >= limit) return history;
        }
    }

    return history;
}

export async function restoreRemoteBackup(path: string): Promise<RestoreBackupResult> {
    const normalizedPath = path.trim();
    if (!normalizedPath) {
        return { status: 'error', reason: 'missing_backup_path' };
    }

    const config = resolveConfig();
    if (!config) {
        return {
            status: 'error',
            reason: 'missing_backup_config',
            debug: 'missing EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY/EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET',
        };
    }

    const supabase = getSupabaseClient(config);

    let payload = '';
    try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(config.bucket)
            .createSignedUrl(normalizedPath, 60);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            return {
                status: 'error',
                reason: signedUrlError?.message || 'failed_to_sign_backup_url',
            };
        }

        const response = await fetch(signedUrlData.signedUrl);
        if (!response.ok) {
            return {
                status: 'error',
                reason: `download_failed_${response.status}`,
            };
        }
        payload = await response.text();
    } catch (error) {
        return {
            status: 'error',
            reason: 'network_or_transport_error',
            debug: toErrorDetail(error),
        };
    }

    let snapshot: BackupSnapshot;
    try {
        snapshot = parseBackupSnapshot(payload);
    } catch (error) {
        return {
            status: 'error',
            reason: 'invalid_backup_file',
            debug: toErrorDetail(error),
        };
    }

    try {
        await applyBackupSnapshot(snapshot);
    } catch (error) {
        return {
            status: 'error',
            reason: 'restore_failed',
            debug: toErrorDetail(error),
        };
    }

    return {
        status: 'success',
        restoredPath: normalizedPath,
    };
}

export async function restoreLocalBackup(path: string): Promise<RestoreBackupResult> {
    const normalizedPath = path.trim();
    if (!normalizedPath) {
        return { status: 'error', reason: 'missing_backup_path' };
    }

    let payload = '';
    try {
        payload = await FileSystem.readAsStringAsync(normalizedPath, {
            encoding: FileSystem.EncodingType.UTF8,
        });
    } catch (error) {
        return {
            status: 'error',
            reason: 'local_backup_read_failed',
            debug: toErrorDetail(error),
        };
    }

    let snapshot: BackupSnapshot;
    try {
        snapshot = parseBackupSnapshot(payload);
    } catch (error) {
        return {
            status: 'error',
            reason: 'invalid_backup_file',
            debug: toErrorDetail(error),
        };
    }

    try {
        await applyBackupSnapshot(snapshot);
    } catch (error) {
        return {
            status: 'error',
            reason: 'restore_failed',
            debug: toErrorDetail(error),
        };
    }

    return {
        status: 'success',
        restoredPath: normalizedPath,
    };
}
