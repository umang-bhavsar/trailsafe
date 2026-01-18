export type WeatherCondition = 'Clear' | 'Cloudy' | 'Rain' | 'Storm' | 'Fog';
export type BusynessLevel = 'Low' | 'Medium' | 'High';

const weatherConditions: WeatherCondition[] = ['Clear', 'Cloudy', 'Rain', 'Storm', 'Fog'];
const busynessLevels: BusynessLevel[] = ['Low', 'Medium', 'High'];

export function getWeatherCondition(seed?: number): WeatherCondition {
    const index = seed !== undefined
        ? Math.abs(seed) % weatherConditions.length
        : Math.floor(Math.random() * weatherConditions.length);
    return weatherConditions[index];
}

export function getWeatherEmoji(condition: WeatherCondition): string {
    switch (condition) {
        case 'Clear': return '☀️';
        case 'Cloudy': return '☁️';
        case 'Rain': return '🌧️';
        case 'Storm': return '⛈️';
        case 'Fog': return '🌫️';
    }
}

export function getSunsetTime(currentTime: Date = new Date()): Date {
    // Simulate sunset based on month (earlier in winter, later in summer)
    const month = currentTime.getMonth();
    let sunsetHour = 17; // Default 5 PM

    if (month >= 4 && month <= 8) {
        sunsetHour = 20; // Summer: 8 PM
    } else if (month >= 9 || month <= 2) {
        sunsetHour = 17; // Winter: 5 PM
    } else {
        sunsetHour = 19; // Spring/Fall: 7 PM
    }

    const sunset = new Date(currentTime);
    sunset.setHours(sunsetHour, 30, 0, 0);
    return sunset;
}

export function formatTimeUntilSunset(sunset: Date, now: Date = new Date()): string {
    const diffMs = sunset.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
        return 'After sunset';
    }

    if (diffHours > 0) {
        return `${diffHours}h ${diffMins}m until sunset`;
    }
    return `${diffMins}m until sunset`;
}

export function getBusyness(seed?: number): BusynessLevel {
    const index = seed !== undefined
        ? Math.abs(seed) % busynessLevels.length
        : Math.floor(Math.random() * busynessLevels.length);
    return busynessLevels[index];
}

export function getBusynessColor(level: BusynessLevel): string {
    switch (level) {
        case 'Low': return '#4CAF50';
        case 'Medium': return '#FFC107';
        case 'High': return '#F44336';
    }
}

export interface SafetyFactors {
    weather: WeatherCondition;
    hoursUntilSunset: number;
    busyness: BusynessLevel;
    difficulty: string;
    distanceKm: number;
}

export function calculateSafetyScore(factors: SafetyFactors): number {
    let score = 10;

    // Weather impact
    switch (factors.weather) {
        case 'Storm': score -= 4; break;
        case 'Rain': score -= 2; break;
        case 'Fog': score -= 1.5; break;
        case 'Cloudy': score -= 0.5; break;
    }

    // Time until sunset impact
    if (factors.hoursUntilSunset < 1) {
        score -= 3;
    } else if (factors.hoursUntilSunset < 2) {
        score -= 1.5;
    } else if (factors.hoursUntilSunset < 3) {
        score -= 0.5;
    }

    // Difficulty impact
    switch (factors.difficulty) {
        case 'Hard': score -= 1; break;
        case 'Moderate': score -= 0.5; break;
    }

    // Distance impact
    if (factors.distanceKm > 15) {
        score -= 1;
    } else if (factors.distanceKm > 10) {
        score -= 0.5;
    }

    // Busyness can be good (help available) or bad (crowded)
    if (factors.busyness === 'Low') {
        score -= 0.5; // Slightly less safe if alone
    }

    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function getSafetyScoreColor(score: number): string {
    if (score >= 7) return '#4CAF50';
    if (score >= 4) return '#FFC107';
    return '#F44336';
}

export function getSafetyScoreLabel(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    if (score >= 2) return 'Caution';
    return 'Dangerous';
}
