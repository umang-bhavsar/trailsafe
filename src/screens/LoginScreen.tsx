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
import { Trail } from '../components/TrailCard';

type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
    Explore: undefined;
    Trail: { trail: Trail };
    Hike: { trail: Trail };
};

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignIn = async () => {
        setLoading(true);
        setError('');
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        setLoading(false);

        if (signInError) {
            setError(signInError.message);
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
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoIcon}>⛰️</Text>
                        </View>
                        <Text style={styles.title}>TrailSafe</Text>
                        <Text style={styles.subtitle}>Your safety companion for every adventure</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            placeholder="enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            leftIcon={<Text style={styles.inputIcon}>✉️</Text>}
                            style={styles.inputText}
                        />
                        <Input
                            placeholder="set up a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                            style={styles.inputText}
                        />

                        <Text style={styles.forgot}>Forgot password?</Text>

                        <Button
                            title="Sign In"
                            onPress={handleSignIn}
                            loading={loading}
                            size="large"
                            style={styles.primaryButton}
                        />

                        <Text style={styles.signupLink}>
                            Don't have an account?{' '}
                            <Text style={styles.signupLinkHighlight} onPress={() => navigation.navigate('SignUp')}>
                                Sign up
                            </Text>
                        </Text>

                        {!!error && <Text style={styles.errorText}>{error}</Text>}
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
        fontSize: 32,
    },
    title: {
        ...typography.h1,
        fontSize: 36,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    form: {
        width: '100%',
    },
    inputIcon: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    inputText: {
        color: colors.textPrimary,
        fontSize: 16,
    },
    forgot: {
        ...typography.bodySmall,
        color: colors.accent,
        textAlign: 'right',
        marginTop: -spacing.sm,
        marginBottom: spacing.md,
    },
    primaryButton: {
        marginTop: spacing.sm,
        borderRadius: 24,
        paddingVertical: spacing.lg,
    },
    errorText: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginTop: spacing.md,
        color: colors.danger,
    },
    signupLink: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginTop: spacing.lg,
        color: colors.textSecondary,
    },
    signupLinkHighlight: {
        color: colors.accent,
        fontWeight: '600',
    },
    logoBadge: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
});
