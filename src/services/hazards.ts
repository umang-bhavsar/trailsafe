import { supabase } from './supabase';
import { LatLng } from './googleRoutes';

export interface HazardReport {
    trailId: string;
    location?: LatLng | null;
    note?: string;
}

export async function reportHazard({ trailId, location, note }: HazardReport): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { error } = await supabase
        .from('hazards')
        .insert({
            trail_id: trailId,
            user_id: userId,
            lat: location?.latitude ?? null,
            lng: location?.longitude ?? null,
            note: note || null,
        });

    if (error) {
        throw new Error(error.message);
    }
}

export async function getRecentHazardCount(trailId: string): Promise<number> {
    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
        .from('hazards')
        .select('id', { count: 'exact', head: true })
        .eq('trail_id', trailId)
        .gte('created_at', since);

    if (error) {
        console.warn('Failed to load hazards count', error.message);
        return 0;
    }

    return count ?? 0;
}
