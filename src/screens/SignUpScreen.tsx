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

type SignUpScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
};

export function SignUpScreen({ navigation }: SignUpScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const handleSignUp = async () => {
        setError('');
        setInfo('');

        if (!email.trim() || !password) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
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
                        <Text style={styles.title}>Create your account</Text>
                        <Text style={styles.subtitle}>TrailSafe</Text>
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
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <Input
                            label="Retype password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Create Account"
                            onPress={handleSignUp}
                            loading={loading}
                            size="large"
                            style={styles.primaryButton}
                        />

                        <Button
                            title="Back to Sign In"
                            onPress={() => navigation.navigate('Login')}
                            variant="secondary"
                            size="large"
                            style={styles.secondaryButton}
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
        fontSize: 56,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    primaryButton: {
        marginTop: spacing.md,
    },
    secondaryButton: {
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
