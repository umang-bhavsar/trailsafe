import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography } from '../theme';

interface SafetyCardProps {
    icon: string;
    title: string;
    value: string;
    valueColor?: string;
    subtitle?: string;
}

export function SafetyCard({ icon, title, value, valueColor, subtitle }: SafetyCardProps) {
    return (
        <Card style={styles.card}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>
                {value}
            </Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.md,
        minWidth: 100,
    },
    icon: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.caption,
        marginBottom: spacing.xs,
    },
    value: {
        ...typography.h3,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
});
