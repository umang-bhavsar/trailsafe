import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    ActivityIndicator,
} from 'react-native';
import MapView, {
    Polyline,
    Marker,
    PROVIDER_GOOGLE,
    Region,
    MapType,
    LatLng,
} from 'react-native-maps';
import { colors, spacing, typography, borderRadius } from '../theme';
import { config, isGoogleMapsConfigured } from '../config';
import { BreadcrumbPoint } from '../utils/storage';
import { Trail } from './TrailCard';

interface TrailMapProps {
    trail: Trail;
    breadcrumbs?: BreadcrumbPoint[];
    showUserLocation?: boolean;
    isTracking?: boolean;
    onMapReady?: () => void;
    mapType?: MapType;
    showTrailhead?: boolean;
    centerOnUser?: boolean;
}

export function TrailMap({
    trail,
    breadcrumbs = [],
    showUserLocation = true,
    isTracking = false,
    onMapReady,
    mapType = 'terrain',
    showTrailhead = true,
    centerOnUser = false,
}: TrailMapProps) {
    const mapRef = useRef<MapView>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    // Convert breadcrumbs to LatLng format
    const polylineCoordinates: LatLng[] = breadcrumbs.map(p => ({
        latitude: p.lat,
        longitude: p.lng,
    }));

    // Calculate the region to display based on breadcrumbs or trail
    const getInitialRegion = useCallback((): Region => {
        if (breadcrumbs.length > 0) {
            const lats = breadcrumbs.map(p => p.lat);
            const lngs = breadcrumbs.map(p => p.lng);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            return {
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
                longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
            };
        }

        return {
            latitude: trail.lat,
            longitude: trail.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
    }, [breadcrumbs, trail]);

    // Animate to new position when breadcrumbs change
    useEffect(() => {
        if (isMapReady && mapRef.current && breadcrumbs.length > 0 && centerOnUser) {
            const lastPoint = breadcrumbs[breadcrumbs.length - 1];
            mapRef.current.animateToRegion({
                latitude: lastPoint.lat,
                longitude: lastPoint.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 500);
        }
    }, [breadcrumbs, isMapReady, centerOnUser]);

    // Fit map to show all breadcrumbs when tracking starts
    useEffect(() => {
        if (isMapReady && mapRef.current && breadcrumbs.length > 1 && !centerOnUser) {
            mapRef.current.fitToCoordinates(polylineCoordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [isMapReady, breadcrumbs.length, centerOnUser]);

    const handleMapReady = () => {
        setIsMapReady(true);
        onMapReady?.();
    };

    // Check if Google Maps API is configured
    if (!isGoogleMapsConfigured() && Platform.OS !== 'ios') {
        return (
            <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackIcon}>🗺️</Text>
                <Text style={styles.fallbackTitle}>Map Not Configured</Text>
                <Text style={styles.fallbackText}>
                    Add your Google Maps API key to .env
                </Text>
                <View style={styles.statsBox}>
                    <Text style={styles.statsTitle}>Tracking Stats</Text>
                    <Text style={styles.statsValue}>{breadcrumbs.length} points recorded</Text>
                    {breadcrumbs.length > 0 && (
                        <Text style={styles.statsCoords}>
                            Last: {breadcrumbs[breadcrumbs.length - 1].lat.toFixed(5)},
                            {breadcrumbs[breadcrumbs.length - 1].lng.toFixed(5)}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={getInitialRegion()}
                mapType={mapType}
                showsUserLocation={showUserLocation}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
                onMapReady={handleMapReady}
                loadingEnabled={true}
                loadingIndicatorColor={colors.accent}
                loadingBackgroundColor={colors.background}
            >
                {/* Trail Polyline */}
                {polylineCoordinates.length > 0 && (
                    <Polyline
                        coordinates={polylineCoordinates}
                        strokeColor={colors.accent}
                        strokeWidth={config.map.polylineWidth}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}

                {/* Current Position Marker */}
                {breadcrumbs.length > 0 && (
                    <Marker
                        coordinate={{
                            latitude: breadcrumbs[breadcrumbs.length - 1].lat,
                            longitude: breadcrumbs[breadcrumbs.length - 1].lng,
                        }}
                        title="Current Position"
                        description={`Point ${breadcrumbs.length}`}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.currentPositionMarker}>
                            <View style={[
                                styles.currentPositionDot,
                                isTracking && styles.currentPositionDotPulsing,
                            ]} />
                        </View>
                    </Marker>
                )}

                {/* Start Point Marker */}
                {breadcrumbs.length > 1 && (
                    <Marker
                        coordinate={{
                            latitude: breadcrumbs[0].lat,
                            longitude: breadcrumbs[0].lng,
                        }}
                        title="Start Point"
                        pinColor={colors.success}
                    />
                )}

                {/* Trailhead Marker */}
                {showTrailhead && (
                    <Marker
                        coordinate={{
                            latitude: trail.lat,
                            longitude: trail.lng,
                        }}
                        title={trail.name}
                        description={`${trail.difficulty} • ${trail.distanceKm} km`}
                        pinColor={colors.warning}
                    />
                )}
            </MapView>

            {/* Loading Overlay */}
            {!isMapReady && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={styles.loadingText}>Loading map...</Text>
                </View>
            )}

            {/* Tracking Indicator */}
            {isTracking && (
                <View style={styles.trackingBadge}>
                    <View style={styles.trackingDot} />
                    <Text style={styles.trackingText}>TRACKING</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: borderRadius.lg,
    },
    map: {
        flex: 1,
    },
    fallbackContainer: {
        flex: 1,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    fallbackIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    fallbackTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    fallbackText: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    statsBox: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        width: '100%',
        alignItems: 'center',
    },
    statsTitle: {
        ...typography.caption,
        marginBottom: spacing.sm,
    },
    statsValue: {
        ...typography.h3,
        color: colors.accent,
    },
    statsCoords: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.bodySmall,
        marginTop: spacing.md,
    },
    currentPositionMarker: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentPositionDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.accent,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    currentPositionDotPulsing: {
        // In production, would use Animated for pulsing effect
    },
    trackingBadge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.danger + 'E6',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    trackingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        marginRight: spacing.xs,
    },
    trackingText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
