import { Platform } from 'react-native';

const fontFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
});

export const Typography = {
    h1: {
        fontSize: 32,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700' as const,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 20,
        fontWeight: '700' as const,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
    },
    bodyBold: {
        fontSize: 16,
        fontWeight: '600' as const,
    },
    caption: {
        fontSize: 14,
        fontWeight: '500' as const,
    },
    small: {
        fontSize: 12,
        fontWeight: '500' as const,
    },
    tiny: {
        fontSize: 10,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
    },
    money: {
        fontSize: 28,
        fontWeight: '700' as const,
        fontVariant: ['tabular-nums'] as const,
    },
    moneyLarge: {
        fontSize: 36,
        fontWeight: '800' as const,
        fontVariant: ['tabular-nums'] as const,
    },
};
