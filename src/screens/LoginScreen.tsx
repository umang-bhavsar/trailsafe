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
import { supabase } from '../services/supabase';

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
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const handleSignIn = async () => {
        setLoading(true);
        setError('');
        setInfo('');
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        setLoading(false);

        if (signInError) {
            setError(signInError.message);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError('');
        setInfo('');
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });
        setLoading(false);

        if (signUpError) {
            setError(signUpError.message);
            return;
        }

        if (data.user && !data.session) {
            setInfo('Check your email to confirm your account.');
        }
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

                        <Button
                            title="Create Account"
                            onPress={handleSignUp}
                            loading={loading}
                            size="large"
                            variant="secondary"
                            style={styles.signUpButton}
                        />

                        {!!error && <Text style={styles.errorText}>{error}</Text>}
                        {!!info && <Text style={styles.infoText}>{info}</Text>}
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
    signUpButton: {
        marginTop: spacing.sm,
    },
    errorText: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginTop: spacing.md,
        color: colors.danger,
    },
    infoText: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginTop: spacing.sm,
        color: colors.textSecondary,
    },
});
