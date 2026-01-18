import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem, removeItem, StorageKeys, CheckInData } from '../utils/storage';
import { useDemoMode } from '../context/DemoModeContext';

interface CheckInStatus {
    data: CheckInData | null;
    isActive: boolean;
    isOverdue: boolean;
    remainingMs: number;
    remainingFormatted: string;
}

export function useCheckIn() {
    const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
    const [status, setStatus] = useState<CheckInStatus>({
        data: null,
        isActive: false,
        isOverdue: false,
        remainingMs: 0,
        remainingFormatted: '',
    });
    const { getCurrentTime } = useDemoMode();

    const loadCheckIn = useCallback(async () => {
        const data = await getItem<CheckInData>(StorageKeys.CHECK_IN);
        setCheckInData(data);
    }, []);

    const saveCheckIn = useCallback(async (data: CheckInData) => {
        await setItem(StorageKeys.CHECK_IN, data);
        setCheckInData(data);
    }, []);

    const clearCheckIn = useCallback(async () => {
        await removeItem(StorageKeys.CHECK_IN);
        setCheckInData(null);
    }, []);

    const simulateOverdue = useCallback(async () => {
        if (checkInData) {
            const overdueData = {
                ...checkInData,
                expectedReturnTime: Date.now() - 60000, // 1 minute ago
            };
            await setItem(StorageKeys.CHECK_IN, overdueData);
            setCheckInData(overdueData);
        }
    }, [checkInData]);

    // Update status based on current time
    useEffect(() => {
        const updateStatus = () => {
            if (!checkInData) {
                setStatus({
                    data: null,
                    isActive: false,
                    isOverdue: false,
                    remainingMs: 0,
                    remainingFormatted: '',
                });
                return;
            }

            const now = getCurrentTime().getTime();
            const remainingMs = checkInData.expectedReturnTime - now;
            const isOverdue = remainingMs <= 0;

            let remainingFormatted = '';
            if (isOverdue) {
                const overdueMs = Math.abs(remainingMs);
                const hours = Math.floor(overdueMs / (1000 * 60 * 60));
                const mins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
                remainingFormatted = hours > 0 ? `${hours}h ${mins}m overdue` : `${mins}m overdue`;
            } else {
                const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                remainingFormatted = hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
            }

            setStatus({
                data: checkInData,
                isActive: true,
                isOverdue,
                remainingMs,
                remainingFormatted,
            });
        };

        updateStatus();
        const interval = setInterval(updateStatus, 1000);
        return () => clearInterval(interval);
    }, [checkInData, getCurrentTime]);

    useEffect(() => {
        loadCheckIn();
    }, [loadCheckIn]);

    return {
        status,
        saveCheckIn,
        clearCheckIn,
        simulateOverdue,
        loadCheckIn,
    };
}
