const MAX_POINTS = 5000;
const MAX_DISTANCE_KM = 5000;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcPoints(distanceKm: number): number {
  return Math.max(0, Math.round(MAX_POINTS * (1 - distanceKm / MAX_DISTANCE_KM)));
}

export function formatDistance(km: number): string {
  if (km < 1) return '< 1 km';
  if (km < 1000) return `${Math.round(km)} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}
