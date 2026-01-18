import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
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
                        <View style={styles.logoBadge}>
                        <Image
                            source={require('../../icons/Logo-png.png')}
                            style={styles.logoImage}
                        />
                        </View>
                        <Text style={styles.title}>Sign Up</Text>
                        <Text style={styles.subtitle}>Make an account with us today!</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            placeholder="enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.inputText}
                        />
                        <Input
                            placeholder="set up a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.inputText}
                        />
                        <Input
                            placeholder="retype password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            style={styles.inputText}
                        />

                        <Text style={styles.forgot}>Forgot password?</Text>

                        <Button
                            title="Create Account"
                            onPress={handleSignUp}
                            loading={loading}
                            size="large"
                            style={styles.primaryButton}
                        />

                        <Button
                            title="Sign In"
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
    logoImage: {
        width: 36,
        height: 36,
        resizeMode: 'contain',
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
    primaryButton: {
        marginTop: spacing.sm,
        borderRadius: 24,
        paddingVertical: spacing.lg,
    },
    secondaryButton: {
        marginTop: spacing.sm,
    },
    secondaryButtonText: {
        color: colors.textPrimary,
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
