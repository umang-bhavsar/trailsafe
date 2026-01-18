import { GOOGLE_MAPS_API_KEY, API_BASE_URL } from '@env';

export const config = {
    // Google Maps
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',

    // API
    apiBaseUrl: API_BASE_URL || 'http://localhost:3000/api',

    // App Settings
    app: {
        name: 'TrailSafe',
        version: '1.0.0',
    },

    // Location Tracking Settings
    location: {
        accuracy: 'high' as const,
        timeInterval: 5000, // ms
        distanceInterval: 5, // meters
    },

    // Map Settings
    map: {
        defaultRegion: {
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
        },
        polylineColor: '#FF5722',
        polylineWidth: 4,
    },

    // Demo Mode
    demo: {
        simulatedUserLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
        },
    },
};

export function isGoogleMapsConfigured(): boolean {
    return config.googleMapsApiKey.length > 0 &&
        config.googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
}
