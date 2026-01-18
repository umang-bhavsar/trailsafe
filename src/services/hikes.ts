import { supabase } from './supabase';
import { BreadcrumbPoint } from '../utils/storage';

export interface HikeStartPayload {
    trailId: string;
    emergencyEmail: string;
    expectedReturnAt: string; // ISO timestamp
}

export async function startHike(payload: HikeStartPayload): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('hikes')
        .insert({
            user_id: userData.user.id,
            trail_id: payload.trailId,
            emergency_email: payload.emergencyEmail,
            expected_return_at: payload.expectedReturnAt,
            status: 'active',
        })
        .select('id')
        .single();

    if (error || !data) {
        throw new Error(error?.message || 'Failed to start hike');
    }

    return data.id as string;
}

export async function recordHikePoint(hikeId: string, point: BreadcrumbPoint): Promise<void> {
    const { error: updateError } = await supabase
        .from('hikes')
        .update({
            last_lat: point.lat,
            last_lng: point.lng,
            last_location_at: new Date(point.ts).toISOString(),
        })
        .eq('id', hikeId);

    if (updateError) {
        throw new Error(updateError.message);
    }

    const { error: breadcrumbError } = await supabase
        .from('breadcrumbs')
        .insert({
            hike_id: hikeId,
            lat: point.lat,
            lng: point.lng,
            recorded_at: new Date(point.ts).toISOString(),
        });

    if (breadcrumbError) {
        throw new Error(breadcrumbError.message);
    }
}

export async function endHike(hikeId: string): Promise<void> {
    const { error } = await supabase
        .from('hikes')
        .update({
            ended_at: new Date().toISOString(),
            status: 'completed',
        })
        .eq('id', hikeId);

    if (error) {
        throw new Error(error.message);
    }
}
