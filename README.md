# Photo Location Quiz

A web game that turns your iPhone camera roll into a geography quiz. Can you remember where you took your own photos? Day 12 of my [50 projects challenge](https://reneebe.github.io).

**[Live demo →](https://reneebe.github.io/photo-location-quiz/)**

## How it works

1. Enter your [Gemini API key](https://aistudio.google.com/apikey)
2. Upload photos from your camera roll (up to 100 at a time, add more batches anytime)
3. Photos without GPS are silently skipped — the rest get reverse-geocoded to city names
4. Gemini categorizes each photo (food, sunset, nature, cityscape, etc.)
5. Filter by category, then play — up to 10 questions per round
6. Each question shows a photo and 4 city options; pick where you think it was taken
7. Score is distance-based — the closer your guess, the more points (max 5,000 per question)
8. Results screen shows your total score, medal, and a full breakdown

## Features

- **Category filter** — play only your food photos, sunsets, travel shots, etc.
- **Add more photos** — load additional batches without losing what's already processed
- **Distance scoring** — wrong answers still earn partial points if you're in the right region
- **AI categorization** — Gemini vision classifies each photo automatically
- **No GPS, no problem** — photos without location data are skipped gracefully with a helpful message

## Tips

- Make sure **Location Services → Camera** is set to "While Using" on your iPhone for photos to have GPS
- Photos shared via iMessage, Instagram, etc. usually have GPS stripped — use originals from your camera roll
- The geocoding step takes ~1 second per photo, so 100 photos takes about 2 minutes to process

## Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`exifr`](https://github.com/MikeKovarik/exifr) for GPS extraction
- [Nominatim](https://nominatim.org/) (OpenStreetMap) for reverse geocoding — no API key needed
- Gemini (`gemini-3.1-pro-preview`) for photo categorization and decoy city generation

## Running locally

```bash
npm install
npm run dev
```

You'll need a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
