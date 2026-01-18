import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
    IS_LOGGED_IN: 'isLoggedIn',
    BREADCRUMBS: 'breadcrumbs',
    CHECK_IN: 'checkIn',
    DEMO_TIME_OFFSET: 'demoTimeOffset',
} as const;

export interface BreadcrumbPoint {
    lat: number;
    lng: number;
    ts: number;
}

export interface CheckInData {
    contactName: string;
    contactInfo: string;
    expectedReturnTime: number; // timestamp
    trailId: string;
    startTime: number;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
    }
}

export async function getItem<T>(key: string): Promise<T | null> {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return null;
    }
}

export async function removeItem(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
    }
}

export async function clearAll(): Promise<void> {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}
