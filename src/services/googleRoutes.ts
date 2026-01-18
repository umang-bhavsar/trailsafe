import { GOOGLE_MAPS_API_KEY } from '@env';

export type LatLng = { latitude: number; longitude: number };

function decodePolyline(encoded: string): LatLng[] {
    const coordinates: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let b;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        result = 0;
        shift = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        coordinates.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return coordinates;
}

export interface GoogleRoute {
    coordinates: LatLng[];
    distanceKm: number;
    durationMin: number;
}

export async function getWalkingRoute(
    start: LatLng,
    end: LatLng
): Promise<GoogleRoute | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('GOOGLE_MAPS_API_KEY not configured');
        return null;
    }

    const body = {
        origin: { location: { latLng: { latitude: start.latitude, longitude: start.longitude } } },
        destination: { location: { latLng: { latitude: end.latitude, longitude: end.longitude } } },
        travelMode: 'WALK',
        computeAlternativeRoutes: false,
        languageCode: 'en-US',
        units: 'METRIC',
    };

    try {
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.warn('Google Routes HTTP error', response.status, data);
            return null;
        }
        const route = data?.routes?.[0];
        if (!route?.polyline?.encodedPolyline) {
            console.warn('Google Routes: missing polyline');
            return null;
        }

        const coordinates = decodePolyline(route.polyline.encodedPolyline);
        const distanceKm = (route.distanceMeters || 0) / 1000;
        const durationSec = route.duration ? parseInt(route.duration.replace('s', ''), 10) : 0;

        return {
            coordinates,
            distanceKm,
            durationMin: Math.round(durationSec / 60),
        };
    } catch (error) {
        console.warn('Google Routes fetch failed', error);
        return null;
    }
}
