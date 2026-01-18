import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { TrailScreen } from '../screens/TrailScreen';
import { HikeScreen } from '../screens/HikeScreen';
import { useDemoMode } from '../context/DemoModeContext';
import { colors, spacing } from '../theme';
import { Trail } from '../components/TrailCard';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

export type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
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
            <Image
                source={require('../../icons/Login in - instead of console.png')}
                style={styles.demoButtonIcon}
            />
            {demoMode && <Text style={styles.demoButtonText}>+{timeOffset}m</Text>}
        </TouchableOpacity>
    );
}

export function AppNavigator() {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            setSession(data.session);
            setIsLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                if (!isMounted) return;
                setSession(newSession);
                setIsLoading(false);
            }
        );

        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

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
                {!session ? (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SignUp"
                            component={SignUpScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Explore"
                            component={ExploreScreen}
                            options={{ headerShown: false }}
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
    demoButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    demoButtonActive: {
        backgroundColor: colors.accent + '30',
        borderColor: colors.accent,
    },
    demoButtonText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    demoButtonIcon: {
        width: 18,
        height: 18,
        resizeMode: 'contain',
    },
});
