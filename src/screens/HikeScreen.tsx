import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TrailMap } from '../components/TrailMap';
import { Trail } from '../components/TrailCard';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { useDemoMode } from '../context/DemoModeContext';
import { useUserLocation } from '../context/LocationContext';
import { getWalkingRoute } from '../services/googleRoutes';
import { startHike, recordHikePoint, endHike } from '../services/hikes';
import { useCheckIn } from '../hooks/useCheckIn';
import { reportHazard } from '../services/hazards';

type RootStackParamList = {
    Login: undefined;
    Explore: undefined;
    Trail: { trail: Trail };
    Hike: { trail: Trail };
};

type HikeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Hike'>;
    route: RouteProp<RootStackParamList, 'Hike'>;
};

export function HikeScreen({ navigation, route }: HikeScreenProps) {
    const { trail } = route.params;

    const [isHiking, setIsHiking] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [hikeId, setHikeId] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const lastUploadedTsRef = useRef<number | null>(null);

    const {
        points,
        lastPoint,
        isTracking,
        startTracking,
        stopTracking,
        clearPoints,
        loadSavedPoints,
        setPoints,
        requestPermission,
    } = useLocation();

    const { demoMode, addSimulatedPoints } = useDemoMode();
    const { userLocation } = useUserLocation();
    const { status } = useCheckIn();
    const [routeLine, setRouteLine] = useState<{ latitude: number; longitude: number }[]>([]);

    useEffect(() => {
        loadSavedPoints();
        requestPermission();
    }, [loadSavedPoints, requestPermission]);

    // Timer for elapsed time
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHiking && startTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isHiking, startTime]);

    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const calculateDistance = (): string => {
        if (points.length < 2) return '0.00';

        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
            const R = 6371; // Earth's radius in km
            const dLat = (points[i].lat - points[i - 1].lat) * Math.PI / 180;
            const dLng = (points[i].lng - points[i - 1].lng) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(points[i - 1].lat * Math.PI / 180) * Math.cos(points[i].lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            totalDistance += R * c;
        }
        return totalDistance.toFixed(2);
    };

    const handleStartHike = async () => {
        if (!status.data || status.data.trailId !== trail.id) {
            Alert.alert(
                'Check-in required',
                'Please set a safety check-in on the trail details page before starting your hike.'
            );
            return;
        }

        setIsReporting(false);
        setIsStarting(true);
        const started = await startTracking();
        if (!started) {
            setIsStarting(false);
            Alert.alert(
                'Location Permission Required',
                'Please enable location services to track your hike.'
            );
            return;
        }

        try {
            const expectedReturnAt = new Date(status.data.expectedReturnTime).toISOString();
            const newHikeId = await startHike({
                trailId: trail.id,
                emergencyEmail: status.data.contactInfo,
                expectedReturnAt,
            });

            setHikeId(newHikeId);
            setIsHiking(true);
            setStartTime(Date.now());
            setElapsedTime(0);
            lastUploadedTsRef.current = null;
        } catch (error) {
            stopTracking();
            setIsHiking(false);
            setStartTime(null);
            Alert.alert('Unable to start hike', error instanceof Error ? error.message : 'Try again.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleReportHazard = async () => {
        if (!status.data || status.data.trailId !== trail.id) {
            Alert.alert('Check-in required', 'Set a safety check-in on the trail page before reporting hazards.');
            return;
        }

        const loc = lastPoint
            ? { latitude: lastPoint.lat, longitude: lastPoint.lng }
            : userLocation
                ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                : null;

        setIsReporting(true);
        try {
            await reportHazard({
                trailId: trail.id,
                location: loc || undefined,
            });
            Alert.alert('Hazard reported', 'Thanks for keeping others safe.');
        } catch (error) {
            Alert.alert('Failed to report', error instanceof Error ? error.message : 'Try again.');
        } finally {
            setIsReporting(false);
        }
    };

    const handleEndHike = () => {
        Alert.alert(
            'End Hike',
            `You hiked ${calculateDistance()} km in ${formatTime(elapsedTime)}. End your hike now?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Hike',
                    onPress: async () => {
                        stopTracking();
                        setIsHiking(false);
                        setStartTime(null);
                        if (hikeId) {
                            try {
                                await endHike(hikeId);
                            } catch (error) {
                                console.warn('Failed to end hike:', error);
                            }
                        }
                        setHikeId(null);
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const handlePauseResume = async () => {
        if (isTracking) {
            stopTracking();
        } else {
            await startTracking();
        }
    };

    const handleClearTrack = () => {
        Alert.alert(
            'Clear Track',
            'Are you sure you want to clear all recorded points?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        clearPoints();
                        setElapsedTime(0);
                        setStartTime(null);
                    }
                },
            ]
        );
    };

    const handleAddSimulatedPoints = async () => {
        if (!trail) return;
        const newPoints = await addSimulatedPoints(trail.lat, trail.lng);
        setPoints(newPoints);
    };

    useEffect(() => {
        const fetchRoute = async () => {
            if (!userLocation) return;
            const routeData = await getWalkingRoute(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: trail.lat, longitude: trail.lng }
            );
            if (routeData?.coordinates?.length) {
                setRouteLine(routeData.coordinates);
            }
        };
        fetchRoute();
    }, [userLocation, trail.lat, trail.lng]);

    useEffect(() => {
        if (!isTracking || !hikeId || !lastPoint) return;
        if (lastUploadedTsRef.current === null) {
            recordHikePoint(hikeId, lastPoint)
                .then(() => {
                    lastUploadedTsRef.current = lastPoint.ts;
                })
                .catch(error => console.warn('Failed to upload point:', error));
        }
    }, [isTracking, hikeId, lastPoint]);

    useEffect(() => {
        if (!isTracking || !hikeId) return;

        const interval = setInterval(() => {
            if (!lastPoint) return;
            if (lastUploadedTsRef.current === lastPoint.ts) return;

            recordHikePoint(hikeId, lastPoint)
                .then(() => {
                    lastUploadedTsRef.current = lastPoint.ts;
                })
                .catch(error => console.warn('Failed to upload point:', error));
        }, 60000);

        return () => clearInterval(interval);
    }, [isTracking, hikeId, lastPoint]);

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
            <View style={styles.content}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.pill}>
                        <Text style={styles.pillText}>◀ Trail Details</Text>
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>Active Hike</Text>
                    <TouchableOpacity style={styles.iconPill}>
                        <Text style={styles.pillText}>🎮</Text>
                    </TouchableOpacity>
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    <TrailMap
                        trail={trail}
                        breadcrumbs={points}
                        isTracking={isTracking}
                        showUserLocation={true}
                        mapType="terrain"
                        centerOnUser={isHiking}
                        routeLine={routeLine}
                    />
                </View>

                {/* Stats Panel */}
                <View style={styles.statsPanel}>
                    <Card style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                                <Text style={styles.statLabel}>DURATION</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{calculateDistance()}</Text>
                                <Text style={styles.statLabel}>KM</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{points.length}</Text>
                                <Text style={styles.statLabel}>POINTS</Text>
                            </View>
                        </View>
                    </Card>

                    {lastPoint && (
                        <View style={styles.lastPosition}>
                            <Text style={styles.lastPositionLabel}>Last position:</Text>
                            <Text style={styles.lastPositionCoords}>
                                {lastPoint.lat.toFixed(5)}, {lastPoint.lng.toFixed(5)}
                            </Text>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            title="Report a Hazard"
                            onPress={handleReportHazard}
                            variant="secondary"
                            size="medium"
                            style={styles.hazardButton}
                            loading={isReporting}
                            disabled={isReporting}
                        />

                        {!isHiking ? (
                            <Button
                                title="Start Tracking"
                                onPress={handleStartHike}
                                loading={isStarting}
                                size="large"
                                style={styles.primaryButton}
                                disabled={isStarting}
                            />
                        ) : (
                            <View style={styles.hikingActions}>
                                <Button
                                    title={isTracking ? "Pause" : "Resume"}
                                    onPress={handlePauseResume}
                                    variant="secondary"
                                    size="large"
                                    style={styles.pillButton}
                                />
                                <Button
                                    title="End Hike"
                                    onPress={handleEndHike}
                                    variant="danger"
                                    size="large"
                                    style={styles.endButton}
                                />
                            </View>
                        )}

                        {points.length > 0 && !isHiking && (
                            <Button
                                title="Clear Track"
                                onPress={handleClearTrack}
                                variant="outline"
                                size="medium"
                                style={styles.actionButton}
                            />
                        )}

                        {demoMode && (
                            <View style={styles.demoControls}>
                                <Text style={styles.demoLabel}>DEMO MODE</Text>
                                <Button
                                    title="Add 10 Simulated Points"
                                    onPress={handleAddSimulatedPoints}
                                    variant="secondary"
                                    size="small"
                                />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    mapContainer: {
        flex: 1,
        margin: spacing.md,
        marginBottom: 0,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#0b1b32',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statsPanel: {
        padding: spacing.md,
    },
    statsCard: {
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    statValue: {
        ...typography.h2,
        color: colors.accent,
        marginBottom: spacing.xs,
    },
    statLabel: {
        ...typography.caption,
        fontSize: 10,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border,
    },
    lastPosition: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    lastPositionLabel: {
        ...typography.bodySmall,
        marginRight: spacing.sm,
    },
    lastPositionCoords: {
        ...typography.bodySmall,
        color: colors.accent,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    actions: {
        gap: spacing.md,
    },
    hazardButton: {
        borderRadius: 20,
    },
    primaryButton: {
        borderRadius: 24,
        paddingVertical: spacing.lg,
    },
    actionButton: {
        width: '100%',
    },
    hikingActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    pillButton: {
        flex: 1,
        borderRadius: 20,
    },
    endButton: {
        flex: 1,
        borderRadius: 20,
    },
    demoControls: {
        marginTop: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.accent + '40',
    },
    demoLabel: {
        ...typography.caption,
        color: colors.accent,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    pill: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pillText: {
        ...typography.bodySmall,
        color: colors.textPrimary,
    },
    iconPill: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm + 4,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    topTitle: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '700',
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
});
