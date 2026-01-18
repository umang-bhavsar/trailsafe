import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { TrailScreen } from '../screens/TrailScreen';
import { HikeScreen } from '../screens/HikeScreen';
import { useDemoMode } from '../context/DemoModeContext';
import { getItem, StorageKeys, removeItem } from '../utils/storage';
import { colors, spacing } from '../theme';
import { Trail } from '../components/TrailCard';

export type RootStackParamList = {
    Login: undefined;
    Explore: undefined;
    Trail: { trail: Trail };
    Hike: { trail: Trail };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.card,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.accent,
    },
};

function DemoModeButton() {
    const { demoMode, toggleDemoMode, timeOffset } = useDemoMode();

    return (
        <TouchableOpacity
            style={[styles.demoButton, demoMode && styles.demoButtonActive]}
            onPress={toggleDemoMode}
        >
            <Text style={styles.demoButtonText}>
                {demoMode ? `🎮 +${timeOffset}m` : '🎮'}
            </Text>
        </TouchableOpacity>
    );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
    return (
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
    );
}

export function AppNavigator() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const loggedIn = await getItem<boolean>(StorageKeys.IS_LOGGED_IN);
        setIsLoggedIn(loggedIn === true);
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await removeItem(StorageKeys.IS_LOGGED_IN);
        setIsLoggedIn(false);
    };

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer theme={DarkTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTintColor: colors.textPrimary,
                    headerTitleStyle: {
                        fontWeight: '700',
                    },
                    headerShadowVisible: false,
                }}
            >
                {!isLoggedIn ? (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                        listeners={{
                            focus: () => checkAuthStatus(),
                        }}
                    />
                ) : (
                    <>
                        <Stack.Screen
                            name="Explore"
                            component={ExploreScreen}
                            options={{
                                headerTitle: '',
                                headerRight: () => (
                                    <View style={styles.headerRight}>
                                        <DemoModeButton />
                                        <LogoutButton onLogout={handleLogout} />
                                    </View>
                                ),
                            }}
                            listeners={{
                                focus: () => checkAuthStatus(),
                            }}
                        />
                        <Stack.Screen
                            name="Trail"
                            component={TrailScreen}
                            options={{
                                headerTitle: 'Trail Details',
                                headerRight: () => <DemoModeButton />,
                            }}
                        />
                        <Stack.Screen
                            name="Hike"
                            component={HikeScreen}
                            options={{
                                headerTitle: 'Active Hike',
                                headerRight: () => <DemoModeButton />,
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    demoButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    demoButtonActive: {
        backgroundColor: colors.accent + '30',
        borderColor: colors.accent,
    },
    demoButtonText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    logoutButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    logoutButtonText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});
