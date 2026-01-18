import 'dotenv/config';

export default {
    expo: {
        name: "TrailSafe",
        slug: "trailsafe",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "dark",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#0D0D0D"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.trailsafe.app",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "TrailSafe needs your location to track your hike and provide safety features.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "TrailSafe needs your location to track your hike in the background."
            },
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
            }
        },
        android: {
            package: "com.trailsafe.app",
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#0D0D0D"
            },
            edgeToEdgeEnabled: true,
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION"
            ],
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY || ""
                }
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission: "TrailSafe needs your location to track your hike and provide safety features."
                }
            ]
        ],
        extra: {
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
            apiBaseUrl: process.env.API_BASE_URL,
        }
    }
};
