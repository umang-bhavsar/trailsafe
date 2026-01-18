import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type HikeRecord = {
    id: string;
    trail_id: string;
    emergency_email: string;
    expected_return_at: string;
    last_lat: number | null;
    last_lng: number | null;
    last_location_at: string | null;
};

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const postmarkToken = Deno.env.get('POSTMARK_SERVER_TOKEN');
    const postmarkFrom = Deno.env.get('POSTMARK_FROM_EMAIL');
    const graceMinutes = Number(Deno.env.get('ALERT_GRACE_MINUTES') ?? '10');

    if (!supabaseUrl || !serviceKey || !postmarkToken || !postmarkFrom) {
        return new Response('Missing environment configuration', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
    });

    const threshold = new Date(Date.now() - graceMinutes * 60 * 1000).toISOString();

    const { data: hikes, error } = await supabase
        .from('hikes')
        .select('id, trail_id, emergency_email, expected_return_at, last_lat, last_lng, last_location_at')
        .eq('status', 'active')
        .eq('alert_sent', false)
        .lt('expected_return_at', threshold);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const results: Array<{ id: string; status: string }> = [];

    for (const hike of (hikes || []) as HikeRecord[]) {
        if (hike.last_lat === null || hike.last_lng === null) {
            results.push({ id: hike.id, status: 'skipped_missing_location' });
            continue;
        }

        const mapLink = `https://maps.google.com/?q=${hike.last_lat},${hike.last_lng}`;
        const textBody = [
            'TrailSafe Alert:',
            '',
            'Your friend has not checked back by their expected return time.',
            `Trail ID: ${hike.trail_id}`,
            `Last known coordinates: ${hike.last_lat}, ${hike.last_lng}`,
            `Last location time: ${hike.last_location_at || 'Unknown'}`,
            `Map: ${mapLink}`,
        ].join('\n');

        const emailResponse = await fetch('https://api.postmarkapp.com/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': postmarkToken,
            },
            body: JSON.stringify({
                From: postmarkFrom,
                To: hike.emergency_email,
                Subject: 'TrailSafe alert: hiker overdue',
                TextBody: textBody,
            }),
        });

        if (!emailResponse.ok) {
            results.push({ id: hike.id, status: 'email_failed' });
            continue;
        }

        const { error: updateError } = await supabase
            .from('hikes')
            .update({ alert_sent: true, status: 'overdue' })
            .eq('id', hike.id);

        results.push({ id: hike.id, status: updateError ? 'update_failed' : 'emailed' });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
});
