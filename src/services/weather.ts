export type WeatherCondition = 'Clear' | 'Cloudy' | 'Rain' | 'Storm' | 'Fog';

export interface WeatherResult {
    condition: WeatherCondition;
    temperatureC: number | null;
    windKph: number | null;
    sunrise: Date | null;
    sunset: Date | null;
}

function mapWeatherCode(code: number | undefined): WeatherCondition {
    if (code === undefined || code === null) return 'Clear';
    // Open-Meteo weathercode mapping (simplified)
    if ([95, 96, 99].includes(code)) return 'Storm';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
    if ([45, 48].includes(code)) return 'Fog';
    if ([3].includes(code)) return 'Cloudy';
    if ([1, 2].includes(code)) return 'Cloudy';
    return 'Clear';
}

export async function getWeather(lat: number, lng: number): Promise<WeatherResult | null> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current_weather=true&daily=sunrise,sunset&timezone=auto`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn('Open-Meteo error', res.status);
            return null;
        }
        const data = await res.json();
        const current = data.current_weather || {};
        const daily = data.daily || {};

        const sunriseStr = daily.sunrise?.[0];
        const sunsetStr = daily.sunset?.[0];

        return {
            condition: mapWeatherCode(current.weathercode),
            temperatureC: typeof current.temperature === 'number' ? current.temperature : null,
            windKph: typeof current.windspeed === 'number' ? current.windspeed : null,
            sunrise: sunriseStr ? new Date(sunriseStr) : null,
            sunset: sunsetStr ? new Date(sunsetStr) : null,
        };
    } catch (error) {
        console.warn('Open-Meteo fetch failed', error);
        return null;
    }
}
