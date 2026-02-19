import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../theme';

interface MoneyInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
    large?: boolean;
    editable?: boolean;
}

export function MoneyInput({
    value,
    onChangeText,
    placeholder = '0',
    label,
    large = false,
    editable = true,
}: MoneyInputProps) {
    return (
        <View>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
                <Text style={[styles.prefix, large && styles.prefixLarge]}>RD$</Text>
                <TextInput
                    style={[styles.input, large && styles.inputLarge]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.slate300}
                    keyboardType="numeric"
                    editable={editable}
                />
                <Text style={styles.currency}>DOP</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.slate700,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
    },
    inputDisabled: {
        backgroundColor: Colors.slate50,
        opacity: 0.7,
    },
    prefix: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginRight: 4,
    },
    prefixLarge: {
        fontSize: 24,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        paddingVertical: 14,
    },
    inputLarge: {
        fontSize: 36,
        textAlign: 'center',
    },
    currency: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
});
