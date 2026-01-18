import { GOOGLE_MAPS_API_KEY } from '@env';
import { Trail } from '../components/TrailCard';

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

export interface NearbyPlace {
    placeId: string;
    name: string;
    latitude: number;
    longitude: number;
    rating?: number;
    userRatingsTotal?: number;
    vicinity?: string;
    types: string[];
    distanceKm?: number;
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Search for nearby hiking trails using Google Places API
export async function searchNearbyTrails(
    latitude: number,
    longitude: number,
    radiusMeters: number = 50000 // 50km default
): Promise<NearbyPlace[]> {
    const apiKey = GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.warn('Google Maps API key not configured');
        return [];
    }

    try {
        const url = `${PLACES_API_BASE}/nearbysearch/json?` +
            `location=${latitude},${longitude}` +
            `&radius=${radiusMeters}` +
            `&type=park` +
            `&keyword=trail+hiking` +
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Places API error:', data.status, data.error_message);
            return [];
        }

        const places: NearbyPlace[] = (data.results || []).map((place: any) => ({
            placeId: place.place_id,
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            vicinity: place.vicinity,
            types: place.types || [],
            distanceKm: calculateDistance(
                latitude,
                longitude,
                place.geometry.location.lat,
                place.geometry.location.lng
            ),
        }));

        // Sort by distance
        return places.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } catch (error) {
        console.error('Error fetching nearby trails:', error);
        return [];
    }
}

// Get place details for more information
export async function getPlaceDetails(placeId: string): Promise<any | null> {
    const apiKey = GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        return null;
    }

    try {
        const url = `${PLACES_API_BASE}/details/json?` +
            `place_id=${placeId}` +
            `&fields=name,formatted_address,geometry,rating,reviews,photos,opening_hours,website,formatted_phone_number` +
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Place Details API error:', data.status);
            return null;
        }

        return data.result;
    } catch (error) {
        console.error('Error fetching place details:', error);
        return null;
    }
}

// Convert NearbyPlace to Trail format for compatibility with existing components
export function convertPlaceToTrail(place: NearbyPlace, index: number): Trail {
    // Assign difficulty based on various factors
    const difficulties: Array<'Easy' | 'Moderate' | 'Hard'> = ['Easy', 'Moderate', 'Hard'];
    const difficultyIndex = index % 3;

    return {
        id: `google_${place.placeId}`,
        name: place.name,
        difficulty: difficulties[difficultyIndex],
        lat: place.latitude,
        lng: place.longitude,
        distanceKm: Math.round((place.distanceKm || 5) * 10) / 10,
        elevation: Math.round(100 + Math.random() * 500), // Simulated
        description: place.vicinity || 'Discovered via Google Places',
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    };
}

// Merge local trails with Google Places results
export function mergeTrailSources(
    localTrails: Trail[],
    googlePlaces: NearbyPlace[],
    userLat: number,
    userLng: number
): Trail[] {
    // Calculate distances for local trails
    const localWithDistance = localTrails.map(trail => ({
        ...trail,
        userDistance: calculateDistance(userLat, userLng, trail.lat, trail.lng),
    }));

    // Convert Google Places to trails
    const googleTrails = googlePlaces.slice(0, 10).map((place, i) => ({
        ...convertPlaceToTrail(place, i),
        userDistance: place.distanceKm || 0,
        isFromGoogle: true,
    }));

    // Combine and sort by distance
    const combined = [...localWithDistance, ...googleTrails];
    return combined.sort((a, b) =>
        (a.userDistance || 999) - (b.userDistance || 999)
    );
}
