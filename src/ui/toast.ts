export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
    type?: ToastType;
    title?: string;
    message: string;
    durationMs?: number;
}

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export function subscribeToast(listener: ToastListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function showToast(payload: ToastPayload): void {
    listeners.forEach((listener) => {
        listener(payload);
    });
}
