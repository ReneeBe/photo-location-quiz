import type { Category, CityOption } from '../types';

const BASE = import.meta.env.DEV
  ? '/api/gemini'
  : 'https://generativelanguage.googleapis.com';

const MODEL = 'gemini-3.1-pro-preview';

const VALID_CATEGORIES = ['food','sunset','nature','cityscape','people','pets','architecture','events','other'];

interface GeminiResponse {
  candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  error?: { message: string };
}

async function generate(apiKey: string, parts: object[]): Promise<string> {
  const res = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as GeminiResponse;
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as GeminiResponse;
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  return raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

// Categorize a batch of up to 5 images
export async function categorizePhotos(
  apiKey: string,
  images: { base64: string; mimeType: string }[]
): Promise<Category[]> {
  const imageParts = images.map((img, i) => [
    { text: `Image ${i + 1}:` },
    { inlineData: { mimeType: img.mimeType, data: img.base64 } },
  ]).flat();

  const prompt = {
    text: `Categorize each of the ${images.length} images above in order.
Choose one category per image from: food, sunset, nature, cityscape, people, pets, architecture, events, other.
Return ONLY a JSON array of strings, one per image, e.g. ["food","sunset","nature"].`,
  };

  const raw = await generate(apiKey, [...imageParts, prompt]);
  let result: string[];
  try {
    result = JSON.parse(raw) as string[];
  } catch {
    result = [];
  }

  return result.map((c) =>
    VALID_CATEGORIES.includes(c) ? (c as Category) : 'other'
  );
}

// Generate 3 decoy city options for a quiz question
export async function generateDecoys(
  apiKey: string,
  correctCity: string,
  correctCountry: string,
  correctLat: number,
  correctLon: number
): Promise<CityOption[]> {
  const prompt = `The correct answer is "${correctCity}, ${correctCountry}" (lat: ${correctLat.toFixed(2)}, lon: ${correctLon.toFixed(2)}).

Generate 3 plausible but WRONG multiple-choice city options for a geography quiz.
Include variety: one nearby city, one on the same continent, one on a different continent.
Return ONLY a JSON array of exactly 3 objects:
[{"city":"...","country":"...","lat":0.0,"lon":0.0}]`;

  const raw = await generate(apiKey, [{ text: prompt }]);
  try {
    const decoys = JSON.parse(raw) as CityOption[];
    return decoys.slice(0, 3);
  } catch {
    // Fallback decoys if parsing fails
    return [
      { city: 'London', country: 'United Kingdom', lat: 51.5, lon: -0.1 },
      { city: 'Tokyo', country: 'Japan', lat: 35.7, lon: 139.7 },
      { city: 'São Paulo', country: 'Brazil', lat: -23.5, lon: -46.6 },
    ];
  }
}
