export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export const GOOGLE_MAPS_LIBRARIES: ('visualization' | 'marker' | 'places' | 'geometry')[] = ['visualization', 'marker'];

export const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
export const DEFAULT_ZOOM = 12;

export const CATEGORY_COLORS: Record<string, string> = {
  water_supply: '#3B82F6',
  electricity: '#F59E0B',
  roads_potholes: '#EF4444',
  sanitation_garbage: '#10B981',
  drainage_sewage: '#6366F1',
  street_lighting: '#F97316',
  public_transport: '#8B5CF6',
  ration_card_pds: '#EC4899',
  pension_welfare: '#14B8A6',
  corruption_misconduct: '#DC2626',
  building_construction: '#78716C',
  parks_public_spaces: '#22C55E',
};

export const DEFAULT_MARKER_COLOR = '#6B7280';

export const HEATMAP_GRADIENT = [
  'rgba(0, 255, 255, 0)',
  'rgba(0, 255, 255, 1)',
  'rgba(0, 191, 255, 1)',
  'rgba(0, 127, 255, 1)',
  'rgba(0, 63, 255, 1)',
  'rgba(0, 0, 255, 1)',
  'rgba(0, 0, 223, 1)',
  'rgba(0, 0, 191, 1)',
  'rgba(0, 0, 159, 1)',
  'rgba(0, 0, 127, 1)',
  'rgba(63, 0, 91, 1)',
  'rgba(127, 0, 63, 1)',
  'rgba(191, 0, 31, 1)',
  'rgba(255, 0, 0, 1)',
];

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  acknowledged: { bg: 'bg-blue-100', text: 'text-blue-800' },
  in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800' },
  escalated: { bg: 'bg-red-100', text: 'text-red-800' },
  reopened: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_MARKER_COLOR;
}
