import exifr from 'exifr';

export interface GpsResult {
  lat: number;
  lon: number;
}

export async function extractGps(file: File): Promise<GpsResult | null> {
  try {
    // Try the dedicated GPS helper first
    const gps = await exifr.gps(file);
    if (gps?.latitude != null && gps?.longitude != null) {
      return { lat: gps.latitude, lon: gps.longitude };
    }

    // Fallback: full parse with GPS IFD explicitly enabled
    const parsed = await exifr.parse(file, { gps: true });
    if (parsed?.latitude != null && parsed?.longitude != null) {
      return { lat: parsed.latitude, lon: parsed.longitude };
    }

    return null;
  } catch {
    return null;
  }
}

// Resize image to max 512px, returns base64 jpeg
export function resizeToBase64(file: File, maxPx = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / img.width, maxPx / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7).replace(/^data:image\/jpeg;base64,/, ''));
    };
    img.onerror = reject;
    img.src = url;
  });
}
