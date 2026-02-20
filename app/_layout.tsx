import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppContext';
import { ToastViewport } from '../src/components/ToastViewport';
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
                        <Stack.Screen
                            name="modal/agregar-trabajador"
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen name="trabajador/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="trabajador/editar/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="trabajador/nuevo" options={{ headerShown: false }} />
                        <Stack.Screen name="hoy/calendario" options={{ headerShown: false }} />
                        <Stack.Screen name="hoy/dia" options={{ headerShown: false }} />
                        <Stack.Screen name="hoy/editar" options={{ headerShown: false }} />
                        <Stack.Screen name="historial/semanas" options={{ headerShown: false }} />
                        <Stack.Screen name="backup/historial" options={{ headerShown: false }} />
                        <Stack.Screen name="pagos/semana-pagada" options={{ headerShown: false }} />
                        <Stack.Screen name="pagos/ajustar" options={{ headerShown: false }} />
                    </Stack>
                    <ToastViewport />
                </SafeAreaView>
            </SafeAreaProvider>
        </AppProvider>
    );
}
