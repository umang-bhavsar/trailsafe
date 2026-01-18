# TrailSafe (Expo + Supabase)

Dark-themed hiking safety companion with:
- Supabase auth (email/password)
- Breadcrumb tracking via `expo-location` + `react-native-maps`
- Safety check-ins with expected return time
- Hazard reporting + 48h hazard counts (Supabase)
- AI-powered safety score (Gemini via OpenRouter)

## Prerequisites
- Node 18+ (nvm recommended)
- Expo CLI (bundled via `npm run start`)
- iOS simulator / Android emulator / physical device
- Supabase project (auth enabled)

## Install
```bash
npm install
```

## Environment
Create `.env` in repo root:
```
GOOGLE_MAPS_API_KEY=...
API_BASE_URL=http://localhost:3000/api
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
MAPBOX_ACCESS_TOKEN=...         # optional, if using Mapbox Directions
OPENROUTER_API_KEY=...          # required for AI safety score
```

Types for env vars live in `src/types/env.d.ts`.

## Supabase setup
1) Run migrations in SQL editor (or `supabase db push` if using CLI):
   - `supabase/migrations/202501180001_hikes.sql` (hikes, breadcrumbs, RLS)
   - `supabase/migrations/202501200001_hazards.sql` (hazards, RLS, purge cron)
2) Ensure `pg_cron`/`pg_net` are enabled for the purge job.
3) Set Edge Function secrets (Postmark alerts, service role, etc.) if you use the overdue alert flow:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POSTMARK_SERVER_TOKEN`
   - `POSTMARK_FROM_EMAIL`
   - `ALERT_GRACE_MINUTES`
4) Deploy edge function (overdue alerts) if needed:
   ```bash
   supabase functions deploy send-overdue-alerts
   ```
   Schedule via cron in Supabase UI or SQL.

## Run
```bash
npm run start -- --clear
```
Scan the QR or open in simulator/emulator.

## Features (dev notes)
- Auth: Supabase email/password (`LoginScreen` / `SignUpScreen`).
- Check-in: set contact + return time on Trail screen (single prompt).
- Breadcrumbs: `useLocation` uses `expo-location`; points saved to AsyncStorage.
- Hazards: report from Hike screen; counts shown on Trail screen (last 48h, purged via cron).
- Safety score: Trail screen calls OpenRouter (Gemini 2.5 Pro) with weather, sunset, hazards; falls back to local score if API fails/missing key.
- Maps: `react-native-maps`, Google Routes for walking polyline; Mapbox helper exists but optional.

## Testing tips
- Use Demo Mode (UI toggle) to add simulated points.
- Report a hazard to see hazard count and AI score update on Trail screen.
- Watch Metro logs for OpenRouter requests/responses.

## Notes
- No backend changes are made on UI tweaks; auth and storage remain as-is.
- If Routes/Maps fail, the app gracefully degrades (no crash).
