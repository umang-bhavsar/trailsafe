import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, typography } from '../theme';
import { setItem, StorageKeys } from '../utils/storage';

type RootStackParamList = {
    Login: undefined;
    Explore: undefined;
    Trail: { trailId: string };
    Hike: { trailId: string };
};

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        // Demo login - just save isLoggedIn and navigate
        await setItem(StorageKeys.IS_LOGGED_IN, true);
        setLoading(false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Explore' }],
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>🥾</Text>
                        <Text style={styles.title}>TrailSafe</Text>
                        <Text style={styles.subtitle}>Hike smarter. Stay safe.</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Input
                            label="Password"
                            placeholder="Enter password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Sign In"
                            onPress={handleSignIn}
                            loading={loading}
                            size="large"
                            style={styles.signInButton}
                        />

                        <Text style={styles.demoNote}>
                            Demo mode: Just tap Sign In to continue
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h1,
        fontSize: 40,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    signInButton: {
        marginTop: spacing.md,
    },
    demoNote: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginTop: spacing.lg,
        color: colors.textSecondary,
    },
});
