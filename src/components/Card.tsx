import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
    const cardStyles = [
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 4,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
});
