import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius } from '../theme';

type ChipVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface ChipProps {
    label: string;
    variant?: ChipVariant;
    icon?: React.ReactNode;
    small?: boolean;
}

const variantStyles: Record<ChipVariant, { bg: string; text: string }> = {
    success: { bg: Colors.successLight, text: Colors.successDark },
    warning: { bg: Colors.warningLight, text: Colors.warningDark },
    danger: { bg: Colors.dangerLight, text: Colors.dangerDark },
    info: { bg: Colors.infoLight, text: Colors.primary },
    neutral: { bg: Colors.slate200, text: Colors.slate600 },
    primary: { bg: Colors.primaryLight, text: Colors.primary },
};

export function Chip({ label, variant = 'neutral', icon, small = false }: ChipProps) {
    const vStyle = variantStyles[variant];

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: vStyle.bg },
                small && styles.small,
            ]}
        >
            {icon}
            <Text
                style={[
                    styles.label,
                    { color: vStyle.text },
                    small && styles.smallText,
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    small: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
    },
    smallText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
