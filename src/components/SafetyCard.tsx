import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography } from '../theme';

interface SafetyCardProps {
    iconSource: ImageSourcePropType;
    title: string;
    value: string;
    valueColor?: string;
    subtitle?: string;
}

export function SafetyCard({ iconSource, title, value, valueColor, subtitle }: SafetyCardProps) {
    return (
        <Card style={styles.card}>
            <Image source={iconSource} style={styles.iconImage} />
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
    iconImage: {
        width: 28,
        height: 28,
        marginBottom: spacing.xs,
        resizeMode: 'contain',
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
