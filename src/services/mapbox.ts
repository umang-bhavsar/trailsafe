import { MAPBOX_ACCESS_TOKEN } from '@env';

export type LatLng = { latitude: number; longitude: number };

export interface MapboxRoute {
    coordinates: LatLng[];
    distanceKm: number;
    durationMin: number;
}

export async function getWalkingRoute(
    start: LatLng,
    end: LatLng
): Promise<MapboxRoute | null> {
    if (!MAPBOX_ACCESS_TOKEN) {
        console.warn('MAPBOX_ACCESS_TOKEN not configured');
        return null;
    }

    const coords = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
        `?alternatives=false&geometries=geojson&overview=full&steps=false` +
        `&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes?.length) {
            console.warn('Mapbox directions error', data.code, data.message);
            return null;
        }

        const route = data.routes[0];
        const coordinates: LatLng[] = (route.geometry?.coordinates || []).map(
            ([lng, lat]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
            })
        );

        return {
            coordinates,
            distanceKm: (route.distance ?? 0) / 1000,
            durationMin: Math.round((route.duration ?? 0) / 60),
        };
    } catch (error) {
        console.warn('Failed to fetch Mapbox route', error);
        return null;
    }
}
