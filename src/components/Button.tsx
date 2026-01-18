import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    style,
    textStyle,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const buttonStyles = [
        styles.base,
        styles[variant],
        styles[`${size}Size`],
        isDisabled && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        isDisabled && styles.disabledText,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? colors.accent : colors.textPrimary}
                    size="small"
                />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primary: {
        backgroundColor: colors.accent,
    },
    secondary: {
        backgroundColor: colors.surface,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    danger: {
        backgroundColor: colors.danger,
    },
    disabled: {
        opacity: 0.5,
    },
    smallSize: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    mediumSize: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    largeSize: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    text: {
        fontWeight: '600',
    },
    primaryText: {
        color: colors.textPrimary,
    },
    secondaryText: {
        color: colors.textPrimary,
    },
    outlineText: {
        color: colors.accent,
    },
    dangerText: {
        color: colors.textPrimary,
    },
    disabledText: {
        opacity: 0.7,
    },
    smallText: {
        fontSize: 14,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 18,
    },
});
