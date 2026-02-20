import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing } from '../../src/theme';

function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function HoyCalendarioScreen() {
    const router = useRouter();
    const today = new Date();
    const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const monthLabel = cursor.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });

    const days = useMemo(() => {
        const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        const firstWeekday = (firstDay.getDay() + 6) % 7;
        const total = firstWeekday + lastDay.getDate();
        const cells = Math.ceil(total / 7) * 7;
        const arr: Array<{ date: Date; inMonth: boolean; disabled: boolean }> = [];

        for (let i = 0; i < cells; i += 1) {
            const d = new Date(cursor.getFullYear(), cursor.getMonth(), i - firstWeekday + 1);
            const inMonth = d.getMonth() === cursor.getMonth();
            const disabled = d > today;
            arr.push({ date: d, inMonth, disabled });
        }
        return arr;
    }, [cursor, today]);

    const canGoNext = !isSameMonth(cursor, today);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color={Colors.slate700} />
                </TouchableOpacity>
                <Text style={styles.title}>Calendario</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.monthBar}>
                    <TouchableOpacity
                        style={styles.monthArrow}
                        onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                    >
                        <MaterialIcons name="chevron-left" size={24} color={Colors.slate700} />
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>{monthLabel}</Text>
                    <TouchableOpacity
                        style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
                        onPress={() => canGoNext && setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                        disabled={!canGoNext}
                    >
                        <MaterialIcons name="chevron-right" size={24} color={canGoNext ? Colors.slate700 : Colors.slate300} />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekdays}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((w, idx) => (
                        <Text key={`${w}-${idx}`} style={styles.weekdayText}>{w}</Text>
                    ))}
                </View>

                <View style={styles.grid}>
                    {days.map((item) => {
                        const iso = toIsoDate(item.date);
                        const isToday = toIsoDate(item.date) === toIsoDate(today);

                        return (
                            <TouchableOpacity
                                key={iso}
                                style={[
                                    styles.dayCell,
                                    !item.inMonth && styles.dayCellOut,
                                    item.disabled && styles.dayCellDisabled,
                                    isToday && styles.dayCellToday,
                                ]}
                                onPress={() =>
                                    router.push({
                                        pathname: '/hoy/dia',
                                        params: { date: iso },
                                    })
                                }
                                disabled={item.disabled}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        !item.inMonth && styles.dayTextOut,
                                        item.disabled && styles.dayTextDisabled,
                                        isToday && styles.dayTextToday,
                                    ]}
                                >
                                    {item.date.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.helpText}>Solo se permiten fechas iguales o anteriores a hoy.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    iconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        padding: Spacing.base,
    },
    monthBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.base,
    },
    monthArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    monthArrowDisabled: {
        opacity: 0.5,
    },
    monthLabel: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        textTransform: 'capitalize',
    },
    weekdays: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekdayText: {
        flex: 1,
        textAlign: 'center',
        color: Colors.textSecondary,
        fontWeight: '700',
        fontSize: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayCell: {
        width: '12.9%',
        aspectRatio: 1,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCellOut: {
        opacity: 0.45,
    },
    dayCellDisabled: {
        backgroundColor: Colors.slate50,
    },
    dayCellToday: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    dayText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    dayTextOut: {
        color: Colors.textSecondary,
    },
    dayTextDisabled: {
        color: Colors.slate400,
    },
    dayTextToday: {
        color: Colors.primary,
        fontWeight: '800',
    },
    helpText: {
        marginTop: Spacing.lg,
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 13,
    },
});
