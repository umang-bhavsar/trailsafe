import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Location from 'expo-location';

interface LocationContextType {
    userLocation: { latitude: number; longitude: number } | null;
    locationPermission: 'undetermined' | 'granted' | 'denied';
    isLoadingLocation: boolean;
    error: string | null;
    requestLocationPermission: () => Promise<boolean>;
    refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const requestLocationPermission = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoadingLocation(true);
            setError(null);

            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                setLocationPermission('granted');

                // Get current location
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                setIsLoadingLocation(false);
                return true;
            } else {
                setLocationPermission('denied');
                setIsLoadingLocation(false);
                return false;
            }
        } catch (err) {
            setError('Failed to get location');
            setIsLoadingLocation(false);
            return false;
        }
    }, []);

    const refreshLocation = useCallback(async () => {
        if (locationPermission !== 'granted') {
            return;
        }

        try {
            setIsLoadingLocation(true);
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (err) {
            setError('Failed to refresh location');
        } finally {
            setIsLoadingLocation(false);
        }
    }, [locationPermission]);

    // Request permission on mount
    useEffect(() => {
        requestLocationPermission();
    }, []);

    return (
        <LocationContext.Provider
            value={{
                userLocation,
                locationPermission,
                isLoadingLocation,
                error,
                requestLocationPermission,
                refreshLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useUserLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useUserLocation must be used within a LocationProvider');
    }
    return context;
}
