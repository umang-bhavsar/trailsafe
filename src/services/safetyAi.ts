import { OPENROUTER_API_KEY } from '@env';

export interface SafetyAIInput {
    locationName: string;
    difficulty: string;
    distanceKm: number;
    hazardsLast48h: number;
    hoursUntilSunset: number;
    weather: string;
}

export interface SafetyAIResult {
    score: number; // 0-10
    label: string;
    rationale?: string;
    source: 'openrouter' | 'fallback';
}

const MODEL = 'google/gemini-2.5-pro'; // available on OpenRouter
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export async function fetchSafetyScoreFromAI(input: SafetyAIInput): Promise<SafetyAIResult> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

const prompt = `
You are a hiking safety evaluator.
Return JSON only: {"score": number 0-10, "label": "Excellent|Good|Fair|Caution|Dangerous"}

Hazards weighting (highest priority):
- 0 hazards in 48h: no penalty.
- 1–2 hazards: subtract 2–3 points total.
- 3–4 hazards: subtract 4–5 points total.
- 5+ hazards: cap score at 3 and label should be Caution or Dangerous.

Other factors:
- Sunset: if hoursUntilSunset < 2, subtract 2; <1, subtract 3.
- Weather: Storm -4, Rain -2, Fog -1.5, Cloudy -0.5, Clear 0.
- Difficulty: Hard -1, Moderate -0.5, Easy 0.
- DistanceKm: small factor only.

Clamp score to [0,10].

Input:
- location: ${input.locationName}
- difficulty: ${input.difficulty}
- distanceKm: ${input.distanceKm}
- hazardsLast48h: ${input.hazardsLast48h}
- hoursUntilSunset: ${input.hoursUntilSunset.toFixed(1)}
- weather: ${input.weather}
`;

    const body = {
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.3,
        max_tokens: 128,
    };

    try {
        console.log('OpenRouter request', JSON.stringify(body, null, 2));
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn('OpenRouter HTTP error', res.status, errText);
            throw new Error(`OpenRouter HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('OpenRouter raw response', JSON.stringify(data, null, 2));
        const text = data?.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error('OpenRouter empty response');
        }

        // Attempt to parse JSON from the response
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        const jsonText = jsonStart !== -1 && jsonEnd !== -1 ? text.slice(jsonStart, jsonEnd + 1) : text;
        const parsed = JSON.parse(jsonText);

        const score = typeof parsed.score === 'number' ? parsed.score : NaN;
        const label = typeof parsed.label === 'string' ? parsed.label : '';

        if (Number.isNaN(score) || !label) {
            throw new Error('OpenRouter invalid payload');
        }

        return {
            score: Math.min(10, Math.max(0, Math.round(score * 10) / 10)),
            label,
            source: 'openrouter',
        };
    } catch (error) {
        console.warn('OpenRouter failed', error);
        throw error;
    }
}
