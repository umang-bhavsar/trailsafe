import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Modal,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SafetyCard } from '../components/SafetyCard';
import { Trail } from '../components/TrailCard';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useCheckIn } from '../hooks/useCheckIn';
import { useDemoMode } from '../context/DemoModeContext';
import { CheckInData } from '../utils/storage';
import {
    getWeatherCondition,
    getWeatherEmoji,
    getSunsetTime,
    formatTimeUntilSunset,
    getBusyness,
    getBusynessColor,
    calculateSafetyScore,
    getSafetyScoreColor,
    getSafetyScoreLabel,
} from '../utils/safety';
import trailsData from '../data/trails.json';

type RootStackParamList = {
    Login: undefined;
    Explore: undefined;
    Trail: { trail: Trail };
    Hike: { trail: Trail };
};

type TrailScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Trail'>;
    route: RouteProp<RootStackParamList, 'Trail'>;
};

const difficultyColors = {
    Easy: colors.success,
    Moderate: colors.warning,
    Hard: colors.danger,
};

export function TrailScreen({ navigation, route }: TrailScreenProps) {
    const { trail } = route.params;

    const [checkInModalVisible, setCheckInModalVisible] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [expectedHours, setExpectedHours] = useState('2');

    const { status, saveCheckIn, clearCheckIn, simulateOverdue } = useCheckIn();
    const { getCurrentTime, demoMode, fastForwardTime } = useDemoMode();

    // Generate safety data based on trail
    const safetyData = useMemo(() => {
        const now = getCurrentTime();
        const seed = parseInt(trail.id, 10) || 1;
        const weather = getWeatherCondition(seed);
        const sunset = getSunsetTime(now);
        const hoursUntilSunset = (sunset.getTime() - now.getTime()) / (1000 * 60 * 60);
        const busyness = getBusyness(seed + 1);

        const score = calculateSafetyScore({
            weather,
            hoursUntilSunset,
            busyness,
            difficulty: trail.difficulty || 'Moderate',
            distanceKm: trail.distanceKm || 5,
        });

        return { weather, sunset, hoursUntilSunset, busyness, score };
    }, [trail, getCurrentTime]);

    const handleSetCheckIn = async () => {
        if (!contactName.trim() || !contactInfo.trim()) {
            Alert.alert('Missing Information', 'Please fill in all fields');
            return;
        }

        const hours = parseFloat(expectedHours) || 2;
        const expectedReturnTime = Date.now() + hours * 60 * 60 * 1000;

        const checkInData: CheckInData = {
            contactName: contactName.trim(),
            contactInfo: contactInfo.trim(),
            expectedReturnTime,
            trailId: trail.id,
            startTime: Date.now(),
        };

        await saveCheckIn(checkInData);
        setCheckInModalVisible(false);
        Alert.alert('Check-in Set', `Your contact will be notified if you're not back by ${new Date(expectedReturnTime).toLocaleTimeString()}`);
    };

    const handleClearCheckIn = () => {
        Alert.alert(
            'Clear Check-in',
            'Are you sure you want to clear your check-in?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCheckIn },
            ]
        );
    };

    if (!trail) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Trail not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Trail Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{trail.name}</Text>
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
                        <Text style={styles.metaText}>{trail.distanceKm} km</Text>
                        <Text style={styles.metaText}>↑ {trail.elevation}m</Text>
                    </View>
                    <Text style={styles.description}>{trail.description}</Text>
                </View>

                {/* Safety Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Safety Conditions</Text>
                    <View style={styles.safetyGrid}>
                        <SafetyCard
                            icon={getWeatherEmoji(safetyData.weather)}
                            title="WEATHER"
                            value={safetyData.weather}
                        />
                        <SafetyCard
                            icon="🌅"
                            title="SUNSET"
                            value={formatTimeUntilSunset(safetyData.sunset, getCurrentTime())}
                        />
                    </View>
                    <View style={styles.safetyGrid}>
                        <SafetyCard
                            icon="👥"
                            title="BUSYNESS"
                            value={safetyData.busyness}
                            valueColor={getBusynessColor(safetyData.busyness)}
                        />
                        <SafetyCard
                            icon="🛡️"
                            title="SAFETY SCORE"
                            value={`${safetyData.score}/10`}
                            valueColor={getSafetyScoreColor(safetyData.score)}
                            subtitle={getSafetyScoreLabel(safetyData.score)}
                        />
                    </View>
                </View>

                {/* Check-in Status */}
                {status.isActive && status.data?.trailId === trail.id && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Check-in Status</Text>
                        <Card
                            style={status.isOverdue
                                ? { ...styles.checkInStatusCard, ...styles.checkInOverdue }
                                : styles.checkInStatusCard
                            }
                        >
                            <View style={styles.checkInHeader}>
                                <Text style={styles.checkInIcon}>
                                    {status.isOverdue ? '⚠️' : '✓'}
                                </Text>
                                <Text style={[
                                    styles.checkInStatusText,
                                    status.isOverdue && styles.checkInOverdueText,
                                ]}>
                                    {status.isOverdue ? 'OVERDUE' : 'CHECK-IN ACTIVE'}
                                </Text>
                            </View>
                            <Text style={styles.checkInContact}>
                                Contact: {status.data?.contactName}
                            </Text>
                            <Text style={[
                                styles.checkInTime,
                                status.isOverdue && styles.checkInOverdueText,
                            ]}>
                                {status.remainingFormatted}
                            </Text>
                            <View style={styles.checkInButtons}>
                                <Button
                                    title="Clear Check-in"
                                    onPress={handleClearCheckIn}
                                    variant="outline"
                                    size="small"
                                />
                                {demoMode && (
                                    <Button
                                        title="Simulate Overdue"
                                        onPress={simulateOverdue}
                                        variant="danger"
                                        size="small"
                                    />
                                )}
                            </View>
                        </Card>
                    </View>
                )}

                {/* Demo Mode Controls */}
                {demoMode && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Demo Controls</Text>
                        <Card style={styles.demoCard}>
                            <Button
                                title="Fast Forward +30 min"
                                onPress={() => fastForwardTime(30)}
                                variant="secondary"
                                size="small"
                            />
                        </Card>
                    </View>
                )}

                <View style={styles.actions}>
                    <Button
                        title="Start Hike"
                        onPress={() => navigation.navigate('Hike', { trail })}
                        size="large"
                        style={styles.actionButton}
                    />
                    {(!status.isActive || status.data?.trailId !== trail.id) && (
                        <Button
                            title="Set Check-in"
                            onPress={() => setCheckInModalVisible(true)}
                            variant="outline"
                            size="large"
                            style={styles.actionButton}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Check-in Modal */}
            <Modal
                visible={checkInModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCheckInModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Set Check-in</Text>
                            <TouchableOpacity onPress={() => setCheckInModalVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Set up a safety check-in. If you don't return by the expected time,
                            your contact will be notified.
                        </Text>

                        <Input
                            label="Emergency Contact Name"
                            placeholder="John Doe"
                            value={contactName}
                            onChangeText={setContactName}
                        />
                        <Input
                            label="Contact Phone or Email"
                            placeholder="555-1234 or john@email.com"
                            value={contactInfo}
                            onChangeText={setContactInfo}
                        />
                        <Input
                            label="Expected Hike Duration (hours)"
                            placeholder="2"
                            value={expectedHours}
                            onChangeText={setExpectedHours}
                            keyboardType="numeric"
                        />

                        <Button
                            title="Confirm Check-in"
                            onPress={handleSetCheckIn}
                            size="large"
                            style={styles.modalButton}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.sm,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
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
    metaText: {
        ...typography.bodySmall,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.caption,
        marginBottom: spacing.md,
    },
    safetyGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    checkInStatusCard: {
        borderWidth: 1,
        borderColor: colors.success,
    },
    checkInOverdue: {
        borderColor: colors.danger,
        backgroundColor: colors.danger + '10',
    },
    checkInHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    checkInIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    checkInStatusText: {
        ...typography.caption,
        color: colors.success,
    },
    checkInOverdueText: {
        color: colors.danger,
    },
    checkInContact: {
        ...typography.bodySmall,
        marginBottom: spacing.xs,
    },
    checkInTime: {
        ...typography.h3,
        color: colors.success,
        marginBottom: spacing.md,
    },
    checkInButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    demoCard: {
        alignItems: 'flex-start',
    },
    actions: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    actionButton: {
        width: '100%',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        ...typography.h3,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        ...typography.h2,
    },
    modalClose: {
        color: colors.textSecondary,
        fontSize: 24,
        padding: spacing.xs,
    },
    modalDescription: {
        ...typography.bodySmall,
        marginBottom: spacing.lg,
    },
    modalButton: {
        marginTop: spacing.md,
    },
});
