import { useState } from 'react';
import { extractGps, resizeToBase64 } from '../lib/exif';
import { reverseGeocode } from '../lib/geocode';
import { categorizePhotos } from '../lib/gemini';
import type { Photo, Category } from '../types';

export interface ProcessingStatus {
  stage: 'gps' | 'geocoding' | 'categorizing' | 'done';
  current: number;
  total: number;
  found: number;       // how many survived this stage so far
  label: string;
}

const MAX_PHOTOS = 100;
const BATCH_SIZE = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function usePhotoProcessor() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const process = async (files: File[], apiKey: string): Promise<Photo[] | null> => {
    setError(null);
    try {
      const sampled = files.length > MAX_PHOTOS ? shuffle(files).slice(0, MAX_PHOTOS) : [...files];

      // Stage 1: Extract GPS
      const withGps: Array<{ file: File; lat: number; lon: number }> = [];
      for (let i = 0; i < sampled.length; i++) {
        setStatus({ stage: 'gps', current: i + 1, total: sampled.length, found: withGps.length, label: 'Reading GPS data...' });
        const gps = await extractGps(sampled[i]);
        if (gps) withGps.push({ file: sampled[i], ...gps });
      }

      if (withGps.length === 0) {
        setError(
          `None of the ${sampled.length} photos had GPS data. ` +
          `This usually means Location Services is off for the Camera app, or the photos were shared/downloaded (which strips GPS). ` +
          `Try going to Settings → Privacy → Location Services → Camera → set to "While Using".`
        );
        return null;
      }

      // Stage 2: Reverse geocode
      const geocoded: Array<{ file: File; lat: number; lon: number; city: string; country: string }> = [];
      for (let i = 0; i < withGps.length; i++) {
        setStatus({ stage: 'geocoding', current: i + 1, total: withGps.length, found: geocoded.length, label: 'Finding locations...' });
        try {
          const { city, country } = await reverseGeocode(withGps[i].lat, withGps[i].lon);
          geocoded.push({ ...withGps[i], city, country });
        } catch {
          // skip if geocoding fails
        }
      }

      // Stage 3: Categorize in batches
      const photos: Photo[] = [];
      const batches = Math.ceil(geocoded.length / BATCH_SIZE);

      for (let b = 0; b < batches; b++) {
        const batch = geocoded.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        setStatus({
          stage: 'categorizing',
          current: b * BATCH_SIZE + batch.length,
          total: geocoded.length,
          found: photos.length,
          label: 'Categorizing with AI...',
        });

        const images = await Promise.all(
          batch.map(async (p) => ({
            base64: await resizeToBase64(p.file),
            mimeType: 'image/jpeg',
          }))
        );

        let categories: Category[];
        try {
          categories = await categorizePhotos(apiKey, images);
        } catch {
          categories = batch.map(() => 'other' as Category);
        }

        batch.forEach((p, i) => {
          photos.push({
            id: crypto.randomUUID(),
            file: p.file,
            objectUrl: URL.createObjectURL(p.file),
            lat: p.lat,
            lon: p.lon,
            city: p.city,
            country: p.country,
            category: categories[i] ?? 'other',
          });
        });
      }

      setStatus({ stage: 'done', current: photos.length, total: photos.length, found: photos.length, label: 'Ready!' });
      return photos;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Processing failed');
      return null;
    }
  };

  return { process, status, error };
}
