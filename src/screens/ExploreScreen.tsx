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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrailCard, Trail } from '../components/TrailCard';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useUserLocation } from '../context/LocationContext';
import { useDemoMode } from '../context/DemoModeContext';
import { searchNearbyTrails, calculateDistance } from '../services/placesApi';
import { supabase } from '../services/supabase';
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
    const [nearMeFilter, setNearMeFilter] = useState(true);
    const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
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

    const { demoMode, toggleDemoMode, timeOffset } = useDemoMode();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const trails = trailsData as Trail[];

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
                30000
            );

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
        let allTrails = [...trails];

        if (googleTrails.length > 0) {
            allTrails = [...allTrails, ...googleTrails];
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            allTrails = allTrails.filter(trail =>
                trail.name.toLowerCase().includes(query) ||
                trail.difficulty.toLowerCase().includes(query)
            );
        }

        if (difficultyFilter) {
            allTrails = allTrails.filter(trail => trail.difficulty === difficultyFilter);
        }

        const userLat = userLocation?.latitude || 37.7749;
        const userLng = userLocation?.longitude || -122.4194;

        const trailsWithDistance = allTrails.map(trail => ({
            ...trail,
            userDistance: calculateDistance(userLat, userLng, trail.lat, trail.lng),
        }));

        if (nearMeFilter || userLocation) {
            trailsWithDistance.sort((a, b) => (a.userDistance || 0) - (b.userDistance || 0));
        }

        return trailsWithDistance;
    }, [trails, googleTrails, searchQuery, nearMeFilter, difficultyFilter, userLocation]);

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
        <View style={styles.headerContent}>
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
                    <Image
                        source={require('../../icons/location icon.png')}
                        style={styles.locationIconImage}
                    />
                    <Text style={styles.locationBannerText}>
                        Location denied. Tap to enable for nearby trails.
                    </Text>
                </TouchableOpacity>
            ) : userLocation ? (
                <View style={[styles.locationBanner, styles.locationBannerSuccess]}>
                    <Image
                        source={require('../../icons/location icon.png')}
                        style={styles.locationIconImage}
                    />
                    <Text style={styles.locationBannerText}>Showing trails near you</Text>
                    {isLoadingGoogle && (
                        <ActivityIndicator size="small" color={colors.success} style={{ marginLeft: 8 }} />
                    )}
                </View>
            ) : null}

            {/* Search Bar */}
            <View style={styles.searchInputContainer}>
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

            {/* Filters */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterPill, nearMeFilter && styles.filterPillActive]}
                    onPress={() => setNearMeFilter(!nearMeFilter)}
                >
                    <Text style={[styles.filterText, nearMeFilter && styles.filterTextActive]}>
                        Near me
                    </Text>
                </TouchableOpacity>
                {['Easy', 'Moderate', 'Hard'].map(level => (
                    <TouchableOpacity
                        key={level}
                        style={[styles.filterPill, difficultyFilter === level && styles.filterPillActive]}
                        onPress={() => setDifficultyFilter(difficultyFilter === level ? null : level)}
                    >
                        <Text style={[styles.filterText, difficultyFilter === level && styles.filterTextActive]}>
                            {level}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {googleTrails.length > 0 && (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Discovered nearby</Text>
                    <Text style={styles.sectionSubtitle}>{googleTrails.length} trails via Google</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredTrails}
                renderItem={renderTrail}
                keyExtractor={item => item.id}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <View style={styles.headerTop}>
                                <View style={styles.headerTitles}>
                                    <Text style={styles.title}>Explore Trails</Text>
                                    <Text style={styles.subtitle}>
                                        {filteredTrails.length} trails available{userLocation && ' near you'}
                                    </Text>
                                </View>
                                <View style={styles.headerActions}>
                                    <TouchableOpacity
                                        style={[styles.headerButton, demoMode && styles.headerButtonActive]}
                                        onPress={toggleDemoMode}
                                    >
                                        <Image
                                            source={require('../../icons/Login in - instead of console.png')}
                                            style={styles.headerIconImage}
                                        />
                                        {demoMode && (
                                            <Text style={styles.headerButtonText}>+{timeOffset}m</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                        <Text style={styles.logoutText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        {renderHeader()}
                    </>
                }
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
                        <Image
                            source={require('../../icons/Logo-png.png')}
                            style={styles.emptyIconImage}
                        />
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
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitles: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    headerButtonActive: {
        backgroundColor: colors.accent + '30',
        borderColor: colors.accent,
    },
    headerButtonText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    headerIconImage: {
        width: 18,
        height: 18,
        resizeMode: 'contain',
    },
    logoutButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    logoutText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    headerContent: {
        paddingTop: spacing.sm,
    },
    locationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
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
    locationIconImage: {
        width: 16,
        height: 16,
        marginRight: spacing.sm,
        resizeMode: 'contain',
    },
    locationBannerText: {
        ...typography.bodySmall,
        color: colors.textPrimary,
        flex: 1,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
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
        marginBottom: spacing.lg,
    },
    filterPill: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    filterPillActive: {
        borderColor: colors.accent,
        backgroundColor: colors.accent,
    },
    filterText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    filterTextActive: {
        color: colors.white,
        fontWeight: '600',
    },
    sectionHeader: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.body,
        color: colors.accent,
        fontWeight: '700',
    },
    sectionSubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
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
    emptyIconImage: {
        width: 48,
        height: 48,
        marginBottom: spacing.md,
        resizeMode: 'contain',
    },
    emptyText: {
        ...typography.h3,
        color: colors.textSecondary,
    },
    emptySubtext: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});