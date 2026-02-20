import { useMemo } from 'react';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

export const SCREEN_SAFE_AREA_EDGES: readonly Edge[] = ['top', 'left', 'right'];

export function useStickyFooterLayout(scrollBasePadding: number, footerBasePadding: number) {
    const insets = useSafeAreaInsets();

    return useMemo(
        () => ({
            scrollContentPaddingBottom: scrollBasePadding + insets.bottom,
            footerPaddingBottom: Math.max(footerBasePadding, insets.bottom),
        }),
        [footerBasePadding, insets.bottom, scrollBasePadding]
    );
}
