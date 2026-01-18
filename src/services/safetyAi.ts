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
const SYSTEM_PROMPT = 'Return ONLY a JSON object with keys {"score": number 0-10, "label": "Excellent|Good|Fair|Caution|Dangerous"}. No markdown, no code fences, no extra text.';

function extractJsonPayload(text: string): string {
    const trimmed = text.trim();
    const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fencedMatch?.[1]) {
        return fencedMatch[1].trim();
    }
    return trimmed;
}

function parseSafetyJson(text: string): { score: number; label: string } {
    const cleaned = extractJsonPayload(text);

    if (!cleaned || cleaned === '{') {
        throw new Error('OpenRouter returned incomplete JSON');
    }

    try {
        return JSON.parse(cleaned);
    } catch {
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
        }
        throw new Error('OpenRouter invalid JSON payload');
    }
}

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
                role: 'system',
                content: SYSTEM_PROMPT,
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0,
        max_tokens: 256,
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
        const choice = data?.choices?.[0];
        const finishReason = choice?.finish_reason;
        const nativeFinishReason = choice?.native_finish_reason;
        if (finishReason === 'length' || nativeFinishReason === 'MAX_TOKENS') {
            throw new Error('OpenRouter response truncated');
        }

        const text = choice?.message?.content;
        if (!text) {
            throw new Error('OpenRouter empty response');
        }

        const parsed = parseSafetyJson(text);

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
