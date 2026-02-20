import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { subscribeToast, type ToastPayload } from '../ui/toast';

interface QueueToast extends ToastPayload {
    id: number;
    type: 'success' | 'error' | 'info';
    durationMs: number;
}

let toastCounter = 1;

function normalizeToast(payload: ToastPayload): QueueToast {
    return {
        id: toastCounter++,
        type: payload.type ?? 'info',
        title: payload.title,
        message: payload.message,
        durationMs: payload.durationMs ?? 1800,
    };
}

function iconForType(type: QueueToast['type']): keyof typeof MaterialIcons.glyphMap {
    if (type === 'success') return 'check-circle';
    if (type === 'error') return 'error';
    return 'info';
}

function colorForType(type: QueueToast['type']): string {
    if (type === 'success') return Colors.success;
    if (type === 'error') return Colors.danger;
    return Colors.primary;
}

export function ToastViewport() {
    const insets = useSafeAreaInsets();
    const [queue, setQueue] = useState<QueueToast[]>([]);
    const [current, setCurrent] = useState<QueueToast | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-12)).current;

    useEffect(() => {
        return subscribeToast((payload) => {
            setQueue((prev) => [...prev, normalizeToast(payload)]);
        });
    }, []);

    useEffect(() => {
        if (current || queue.length === 0) return;
        setCurrent(queue[0]);
        setQueue((prev) => prev.slice(1));
    }, [current, queue]);

    useEffect(() => {
        if (!current) return;

        const inAnim = Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]);

        const outAnim = Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -12,
                duration: 180,
                useNativeDriver: true,
            }),
        ]);

        inAnim.start();
        const timeoutId = setTimeout(() => {
            outAnim.start(() => {
                setCurrent(null);
            });
        }, current.durationMs);

        return () => {
            clearTimeout(timeoutId);
            inAnim.stop();
            outAnim.stop();
        };
    }, [current, opacity, translateY]);

    if (!current) return null;

    const accent = colorForType(current.type);

    return (
        <View style={[styles.root, { top: insets.top + 10 }]} pointerEvents="none">
            <Animated.View
                style={[
                    styles.toast,
                    {
                        borderLeftColor: accent,
                        opacity,
                        transform: [{ translateY }],
                    },
                ]}
            >
                <View style={styles.iconWrap}>
                    <MaterialIcons name={iconForType(current.type)} size={18} color={accent} />
                </View>
                <View style={styles.textWrap}>
                    {!!current.title && <Text style={styles.title}>{current.title}</Text>}
                    <Text style={styles.message}>{current.message}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        left: 12,
        right: 12,
        zIndex: 9999,
    },
    toast: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    message: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
});
