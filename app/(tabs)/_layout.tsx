import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.slate400,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: -2,
                },
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                },
                tabBarIconStyle: {
                    marginBottom: -2,
                },
            }}
        >
            <Tabs.Screen
                name="hoy"
                options={{
                    title: 'HOY',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="today" size={28} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="adelanto"
                options={{
                    title: 'ADELANTO',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="request-quote" size={28} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pagos"
                options={{
                    title: 'PAGOS',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="paid" size={28} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="trabajadores"
                options={{
                    title: 'EQUIPO',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="groups" size={28} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
