import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AvatarColors, Colors, BorderRadius } from '../theme';

interface AvatarProps {
    iniciales: string;
    colorIndex: number;
    size?: number;
    inactive?: boolean;
}

export function Avatar({ iniciales, colorIndex, size = 56, inactive = false }: AvatarProps) {
    const color = AvatarColors[colorIndex % AvatarColors.length];
    const fontSize = size * 0.35;

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: inactive ? Colors.slate200 : color.bg,
                },
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        fontSize,
                        color: inactive ? Colors.slate500 : color.fg,
                    },
                ]}
            >
                {iniciales}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    text: {
        fontWeight: '700',
    },
});
