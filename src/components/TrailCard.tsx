import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography, borderRadius } from '../theme';

export interface Trail {
    id: string;
    name: string;
    difficulty: 'Easy' | 'Moderate' | 'Hard';
    lat: number;
    lng: number;
    distanceKm: number;
    elevation: number;
    description: string;
    imageUrl: string;
}

interface TrailCardProps {
    trail: Trail;
    onPress: () => void;
    distance?: number; // calculated distance from user
}

const difficultyColors = {
    Easy: colors.success,
    Moderate: colors.warning,
    Hard: colors.danger,
};

export function TrailCard({ trail, onPress, distance }: TrailCardProps) {
    return (
        <Card style={styles.card} onPress={onPress} variant="elevated">
            <View style={styles.content}>
                <View style={styles.info}>
                    <Text style={styles.name}>{trail.name}</Text>
                    <View style={styles.meta}>
                        <View
                            style={[
                                styles.difficultyBadge,
                                { backgroundColor: difficultyColors[trail.difficulty] + '20' }
                            ]}
                        >
                            <Text
                                style={[
                                    styles.difficultyText,
                                    { color: difficultyColors[trail.difficulty] }
                                ]}
                            >
                                {trail.difficulty}
                            </Text>
                        </View>
                        <Text style={styles.distance}>{trail.distanceKm} km</Text>
                        <Text style={styles.elevation}>↑ {trail.elevation}m</Text>
                    </View>
                    {distance !== undefined && (
                        <Text style={styles.fromYou}>
                            {distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)} km away`}
                        </Text>
                    )}
                </View>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: trail.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    content: {
        flexDirection: 'row',
    },
    info: {
        flex: 1,
        paddingRight: spacing.md,
    },
    name: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    difficultyBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '600',
    },
    distance: {
        ...typography.bodySmall,
    },
    elevation: {
        ...typography.bodySmall,
    },
    fromYou: {
        ...typography.bodySmall,
        marginTop: spacing.sm,
        color: colors.accent,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
