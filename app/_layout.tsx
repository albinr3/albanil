import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppContext';
import { Colors } from '../src/theme';

export default function RootLayout() {
    return (
        <AppProvider>
            <SafeAreaProvider>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
                    <StatusBar style="dark" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: Colors.background },
                            animation: 'slide_from_right',
                        }}
                    >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen
                            name="modal/extra"
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen name="trabajador/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="trabajador/nuevo" options={{ headerShown: false }} />
                        <Stack.Screen name="historial/semanas" options={{ headerShown: false }} />
                        <Stack.Screen name="pagos/semana-pagada" options={{ headerShown: false }} />
                        <Stack.Screen name="pagos/ajustar" options={{ headerShown: false }} />
                    </Stack>
                </SafeAreaView>
            </SafeAreaProvider>
        </AppProvider>
    );
}
