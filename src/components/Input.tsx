import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function Input({
    label,
    error,
    containerStyle,
    style,
    ...props
}: InputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '500',
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        color: colors.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputError: {
        borderColor: colors.danger,
    },
    error: {
        color: colors.danger,
        fontSize: 12,
        marginTop: spacing.xs,
    },
});
