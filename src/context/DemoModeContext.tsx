import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getItem, setItem, StorageKeys, BreadcrumbPoint } from '../utils/storage';

interface DemoModeContextType {
    demoMode: boolean;
    toggleDemoMode: () => void;
    timeOffset: number; // minutes added to current time
    fastForwardTime: (minutes: number) => void;
    resetTimeOffset: () => void;
    getCurrentTime: () => Date;
    addSimulatedPoints: (trailLat: number, trailLng: number) => Promise<BreadcrumbPoint[]>;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

// Predefined path offset patterns for simulation
const SIMULATED_PATH_OFFSETS = [
    { lat: 0, lng: 0 },
    { lat: 0.0005, lng: 0.0003 },
    { lat: 0.0010, lng: 0.0008 },
    { lat: 0.0015, lng: 0.0010 },
    { lat: 0.0018, lng: 0.0015 },
    { lat: 0.0020, lng: 0.0020 },
    { lat: 0.0022, lng: 0.0028 },
    { lat: 0.0018, lng: 0.0035 },
    { lat: 0.0012, lng: 0.0040 },
    { lat: 0.0008, lng: 0.0045 },
];

export function DemoModeProvider({ children }: { children: ReactNode }) {
    const [demoMode, setDemoMode] = useState(false);
    const [timeOffset, setTimeOffset] = useState(0);

    const toggleDemoMode = useCallback(() => {
        setDemoMode(prev => !prev);
        if (demoMode) {
            // Reset time offset when turning off demo mode
            setTimeOffset(0);
        }
    }, [demoMode]);

    const fastForwardTime = useCallback((minutes: number) => {
        setTimeOffset(prev => prev + minutes);
    }, []);

    const resetTimeOffset = useCallback(() => {
        setTimeOffset(0);
    }, []);

    const getCurrentTime = useCallback(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + timeOffset);
        return now;
    }, [timeOffset]);

    const addSimulatedPoints = useCallback(async (trailLat: number, trailLng: number): Promise<BreadcrumbPoint[]> => {
        const existingPoints = await getItem<BreadcrumbPoint[]>(StorageKeys.BREADCRUMBS) || [];
        const now = Date.now();

        const newPoints: BreadcrumbPoint[] = SIMULATED_PATH_OFFSETS.map((offset, index) => ({
            lat: trailLat + offset.lat,
            lng: trailLng + offset.lng,
            ts: now - (SIMULATED_PATH_OFFSETS.length - index) * 60000, // 1 minute apart
        }));

        const allPoints = [...existingPoints, ...newPoints];
        await setItem(StorageKeys.BREADCRUMBS, allPoints);
        return allPoints;
    }, []);

    return (
        <DemoModeContext.Provider
            value={{
                demoMode,
                toggleDemoMode,
                timeOffset,
                fastForwardTime,
                resetTimeOffset,
                getCurrentTime,
                addSimulatedPoints,
            }}
        >
            {children}
        </DemoModeContext.Provider>
    );
}

export function useDemoMode() {
    const context = useContext(DemoModeContext);
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoModeProvider');
    }
    return context;
}
