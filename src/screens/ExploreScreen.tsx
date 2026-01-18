import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrailCard, Trail } from '../components/TrailCard';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useUserLocation } from '../context/LocationContext';
import { searchNearbyTrails, calculateDistance } from '../services/placesApi';
import trailsData from '../data/trails.json';

type RootStackParamList = {
    Login: undefined;
    Explore: undefined;
    Trail: { trail: Trail };
    Hike: { trail: Trail };
};

type ExploreScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Explore'>;
};

export function ExploreScreen({ navigation }: ExploreScreenProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [nearMeFilter, setNearMeFilter] = useState(true); // Default ON now
    const [refreshing, setRefreshing] = useState(false);
    const [googleTrails, setGoogleTrails] = useState<Trail[]>([]);
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

    const {
        userLocation,
        locationPermission,
        isLoadingLocation,
        requestLocationPermission,
        refreshLocation,
    } = useUserLocation();

    const trails = trailsData as Trail[];

    // Fetch nearby trails from Google when location is available
    useEffect(() => {
        if (userLocation && locationPermission === 'granted') {
            fetchNearbyTrails();
        }
    }, [userLocation, locationPermission]);


    const fetchNearbyTrails = async () => {
        if (!userLocation) return;

        setIsLoadingGoogle(true);
        try {
            const places = await searchNearbyTrails(
                userLocation.latitude,
                userLocation.longitude,
                30000 // 30km radius
            );

            // Convert to Trail format
            const googleTrailsData = places.slice(0, 10).map((place, i) => ({
                id: `google_${place.placeId}`,
                name: place.name,
                difficulty: (['Easy', 'Moderate', 'Hard'] as const)[i % 3],
                lat: place.latitude,
                lng: place.longitude,
                distanceKm: Math.round((place.distanceKm || 5) * 10) / 10,
                elevation: Math.round(100 + Math.random() * 400),
                description: place.vicinity || 'Nearby trail',
                imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
            }));

            setGoogleTrails(googleTrailsData);
        } catch (error) {
            console.error('Error fetching Google trails:', error);
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    const filteredTrails = useMemo(() => {
        // Combine local and Google trails
        let allTrails = [...trails];

        // Add Google trails if we have user location
        if (googleTrails.length > 0) {
            allTrails = [...allTrails, ...googleTrails];
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            allTrails = allTrails.filter(trail =>
                trail.name.toLowerCase().includes(query) ||
                trail.difficulty.toLowerCase().includes(query)
            );
        }

        // Calculate distances
        const userLat = userLocation?.latitude || 37.7749;
        const userLng = userLocation?.longitude || -122.4194;

        const trailsWithDistance = allTrails.map(trail => ({
            ...trail,
            userDistance: calculateDistance(userLat, userLng, trail.lat, trail.lng),
        }));

        // Sort by distance if "Near me" is active or if we have location
        if (nearMeFilter || userLocation) {
            trailsWithDistance.sort((a, b) => (a.userDistance || 0) - (b.userDistance || 0));
        }

        return trailsWithDistance;
    }, [trails, googleTrails, searchQuery, nearMeFilter, userLocation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshLocation();
        await fetchNearbyTrails();
        setRefreshing(false);
    };

    const renderTrail = ({ item }: { item: Trail & { userDistance?: number } }) => (
        <TrailCard
            trail={item}
            distance={item.userDistance}
            onPress={() => navigation.navigate('Trail', { trail: item })}
        />
    );

    const renderHeader = () => (
        <>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.screenTitle}>Explore Trails</Text>
                    <Text style={styles.screenSubtitle}>
                        {filteredTrails.length} trails available near you
                    </Text>
                </View>
            </View>

            {/* Location Status */}
            {isLoadingLocation ? (
                <View style={styles.locationBanner}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={styles.locationBannerText}>Getting your location...</Text>
                </View>
            ) : locationPermission === 'denied' ? (
                <TouchableOpacity
                    style={[styles.locationBanner, styles.locationBannerError]}
                    onPress={requestLocationPermission}
                >
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationBannerText}>
                        Location denied. Tap to enable for nearby trails.
                    </Text>
                </TouchableOpacity>
            ) : userLocation ? (
                <View style={[styles.locationBanner, styles.locationBannerSuccess]}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationBannerText}>
                        Showing trails near you
                    </Text>
                    {isLoadingGoogle && (
                        <ActivityIndicator size="small" color={colors.success} style={{ marginLeft: 8 }} />
                    )}
                </View>
            ) : null}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search trails..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[
                        styles.filterPill,
                        nearMeFilter && styles.filterPillActive,
                        styles.filterPillPrimary,
                    ]}
                    onPress={() => setNearMeFilter(!nearMeFilter)}
                >
                    <Text style={[
                        styles.filterText,
                        nearMeFilter && styles.filterTextActivePrimary,
                    ]}>
                        Near me
                    </Text>
                </TouchableOpacity>
                {['Easy', 'Moderate', 'Hard'].map(level => (
                    <View
                        key={level}
                        style={[
                            styles.filterPill,
                            styles.difficultyPill,
                        ]}
                    >
                        <Text style={styles.filterText}>{level}</Text>
                    </View>
                ))}
            </View>

            {googleTrails.length > 0 && (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Discovered nearby</Text>
                    <Text style={styles.sectionSubtitle}>{googleTrails.length} trails via Google</Text>
                </View>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Explore Trails</Text>
                <Text style={styles.subtitle}>
                    {filteredTrails.length} trails available
                    {userLocation && ' near you'}
                </Text>
            </View>

            <FlatList
                data={filteredTrails}
                renderItem={renderTrail}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏔️</Text>
                        <Text style={styles.emptyText}>No trails found</Text>
                        <Text style={styles.emptySubtext}>Try a different search term</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    title: {
        ...typography.h1,
    },
    subtitle: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
    },
    topBar: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    screenTitle: {
        ...typography.h1,
    },
    screenSubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    locationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    locationBannerSuccess: {
        borderColor: colors.success + '40',
        backgroundColor: colors.success + '10',
    },
    locationBannerError: {
        borderColor: colors.warning + '40',
        backgroundColor: colors.warning + '10',
    },
    locationIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    locationBannerText: {
        ...typography.bodySmall,
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        fontSize: 16,
    },
    clearIcon: {
        color: colors.textSecondary,
        fontSize: 16,
        padding: spacing.xs,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    filterPill: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    filterPillActive: {
        borderColor: colors.accent,
        backgroundColor: colors.accent + '20',
    },
    filterPillPrimary: {},
    difficultyPill: {},
    filterText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    filterTextActivePrimary: {
        color: colors.accent,
        fontWeight: '600',
    },
    sectionHeader: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.body,
        color: colors.accent,
        fontWeight: '700',
    },
    sectionSubtitle: {
        ...typography.bodySmall,
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.h3,
        color: colors.textSecondary,
    },
    emptySubtext: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
    },
});
