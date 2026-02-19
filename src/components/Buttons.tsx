import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    ActivityIndicator,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface ButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof MaterialIcons.glyphMap;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    fullWidth?: boolean;
}

export function PrimaryButton({
    title,
    onPress,
    icon,
    disabled = false,
    loading = false,
    style,
    fullWidth = true,
}: ButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.primary,
                Shadows.primaryButton,
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.85}
        >
            {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
            ) : (
                <>
                    {icon && (
                        <MaterialIcons name={icon} size={22} color={Colors.textInverse} />
                    )}
                    <Text style={styles.primaryText}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

export function SecondaryButton({
    title,
    onPress,
    icon,
    disabled = false,
    style,
    fullWidth = true,
}: ButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.secondary,
                fullWidth && styles.fullWidth,
                disabled && styles.disabledSecondary,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {icon && (
                <MaterialIcons name={icon} size={22} color={Colors.slate700} />
            )}
            <Text style={styles.secondaryText}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    primary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    primaryText: {
        color: Colors.textInverse,
        fontSize: 16,
        fontWeight: '700',
    },
    secondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    secondaryText: {
        color: Colors.slate700,
        fontSize: 16,
        fontWeight: '700',
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    disabledSecondary: {
        opacity: 0.4,
    },
});
