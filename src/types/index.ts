export type Phase = 'setup' | 'processing' | 'filter' | 'playing' | 'results';

export type Category =
  | 'food'
  | 'sunset'
  | 'nature'
  | 'cityscape'
  | 'people'
  | 'pets'
  | 'architecture'
  | 'events'
  | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  food: '🍜 Food',
  sunset: '🌅 Sunsets',
  nature: '🌿 Nature',
  cityscape: '🏙️ Cityscapes',
  people: '👥 People',
  pets: '🐾 Pets',
  architecture: '🏛️ Architecture',
  events: '🎉 Events',
  other: '📷 Other',
};

export interface CityOption {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface Photo {
  id: string;
  file: File;
  objectUrl: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  category: Category;
}

export interface QuizQuestion {
  photo: Photo;
  options: CityOption[];      // 4 options, shuffled, one is correct
  correctIndex: number;
}

export interface QuizAnswer {
  question: QuizQuestion;
  chosenIndex: number;
  distanceKm: number;
  points: number;
}
