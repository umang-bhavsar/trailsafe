import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { getItem, setItem, StorageKeys, BreadcrumbPoint } from '../utils/storage';

interface LocationState {
    hasPermission: boolean | null;
    isTracking: boolean;
    points: BreadcrumbPoint[];
    lastPoint: BreadcrumbPoint | null;
    error: string | null;
}

export function useLocation() {
    const [state, setState] = useState<LocationState>({
        hasPermission: null,
        isTracking: false,
        points: [],
        lastPoint: null,
        error: null,
    });

    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

    const requestPermission = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            const hasPermission = status === 'granted';
            setState(prev => ({ ...prev, hasPermission }));
            return hasPermission;
        } catch (error) {
            setState(prev => ({ ...prev, error: 'Failed to request location permission' }));
            return false;
        }
    }, []);

    const loadSavedPoints = useCallback(async () => {
        const points = await getItem<BreadcrumbPoint[]>(StorageKeys.BREADCRUMBS) || [];
        const lastPoint = points.length > 0 ? points[points.length - 1] : null;
        setState(prev => ({ ...prev, points, lastPoint }));
        return points;
    }, []);

    const clearPoints = useCallback(async () => {
        await setItem(StorageKeys.BREADCRUMBS, []);
        setState(prev => ({ ...prev, points: [], lastPoint: null }));
    }, []);

    const startTracking = useCallback(async () => {
        if (!state.hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                setState(prev => ({ ...prev, error: 'Location permission not granted' }));
                return false;
            }
        }

        try {
            // Load existing points
            const existingPoints = await getItem<BreadcrumbPoint[]>(StorageKeys.BREADCRUMBS) || [];

            // Seed with current position to ensure we start with a fix immediately
            try {
                const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                    mayShowUserSettingsDialog: true,
                });
                const seedPoint: BreadcrumbPoint = {
                    lat: current.coords.latitude,
                    lng: current.coords.longitude,
                    ts: Date.now(),
                };
                if (existingPoints.length === 0 || (
                    existingPoints[existingPoints.length - 1].lat !== seedPoint.lat ||
                    existingPoints[existingPoints.length - 1].lng !== seedPoint.lng
                )) {
                    existingPoints.push(seedPoint);
                    await setItem(StorageKeys.BREADCRUMBS, existingPoints);
                }
            } catch (seedError) {
                console.warn('Seeding location failed', seedError);
            }

            subscriptionRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 2000,
                    distanceInterval: 0,
                    mayShowUserSettingsDialog: true,
                },
                async (location) => {
                    const newPoint: BreadcrumbPoint = {
                        lat: location.coords.latitude,
                        lng: location.coords.longitude,
                        ts: Date.now(),
                    };

                    setState(prev => {
                        const updatedPoints = [...prev.points, newPoint];
                        // Save to storage asynchronously
                        setItem(StorageKeys.BREADCRUMBS, updatedPoints);
                        return {
                            ...prev,
                            points: updatedPoints,
                            lastPoint: newPoint,
                        };
                    });
                }
            );

            setState(prev => ({
                ...prev,
                isTracking: true,
                points: existingPoints,
                lastPoint: existingPoints.length > 0 ? existingPoints[existingPoints.length - 1] : null,
                error: null
            }));
            return true;
        } catch (error) {
            setState(prev => ({ ...prev, error: 'Failed to start location tracking' }));
            return false;
        }
    }, [state.hasPermission, requestPermission]);

    const stopTracking = useCallback(() => {
        if (subscriptionRef.current) {
            subscriptionRef.current.remove();
            subscriptionRef.current = null;
        }
        setState(prev => ({ ...prev, isTracking: false }));
    }, []);

    const setPoints = useCallback(async (points: BreadcrumbPoint[]) => {
        await setItem(StorageKeys.BREADCRUMBS, points);
        const lastPoint = points.length > 0 ? points[points.length - 1] : null;
        setState(prev => ({ ...prev, points, lastPoint }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
            }
        };
    }, []);

    return {
        ...state,
        requestPermission,
        loadSavedPoints,
        clearPoints,
        startTracking,
        stopTracking,
        setPoints,
    };
}
