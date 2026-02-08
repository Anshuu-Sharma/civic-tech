import { GrievanceCategory } from './types';

// =============================================================================
// Category Configuration
// =============================================================================

export const CATEGORY_LABELS: Record<GrievanceCategory, string> = {
  [GrievanceCategory.WATER_SUPPLY]: 'Water Supply',
  [GrievanceCategory.ELECTRICITY]: 'Electricity',
  [GrievanceCategory.ROADS_POTHOLES]: 'Roads & Potholes',
  [GrievanceCategory.SANITATION_GARBAGE]: 'Sanitation & Garbage',
  [GrievanceCategory.DRAINAGE_SEWAGE]: 'Drainage & Sewage',
  [GrievanceCategory.STREET_LIGHTING]: 'Street Lighting',
  [GrievanceCategory.PUBLIC_TRANSPORT]: 'Public Transport',
  [GrievanceCategory.RATION_CARD_PDS]: 'Ration Card / PDS',
  [GrievanceCategory.PENSION_WELFARE]: 'Pension & Welfare',
  [GrievanceCategory.CORRUPTION_MISCONDUCT]: 'Corruption & Misconduct',
  [GrievanceCategory.BUILDING_CONSTRUCTION]: 'Building & Construction',
  [GrievanceCategory.PARKS_PUBLIC_SPACES]: 'Parks & Public Spaces',
};

export const CATEGORY_LABELS_HI: Record<GrievanceCategory, string> = {
  [GrievanceCategory.WATER_SUPPLY]: '\u091C\u0932 \u0906\u092A\u0942\u0930\u094D\u0924\u093F',
  [GrievanceCategory.ELECTRICITY]: '\u092C\u093F\u091C\u0932\u0940',
  [GrievanceCategory.ROADS_POTHOLES]: '\u0938\u0921\u093C\u0915\u0947\u0902 \u0914\u0930 \u0917\u0921\u094D\u0922\u0947',
  [GrievanceCategory.SANITATION_GARBAGE]: '\u0938\u094D\u0935\u091A\u094D\u091B\u0924\u093E \u0914\u0930 \u0915\u091A\u0930\u093E',
  [GrievanceCategory.DRAINAGE_SEWAGE]: '\u0928\u093E\u0932\u0940 \u0914\u0930 \u0938\u0940\u0935\u0930',
  [GrievanceCategory.STREET_LIGHTING]: '\u0938\u094D\u091F\u094D\u0930\u0940\u091F \u0932\u093E\u0907\u091F',
  [GrievanceCategory.PUBLIC_TRANSPORT]: '\u0938\u093E\u0930\u094D\u0935\u091C\u0928\u093F\u0915 \u092A\u0930\u093F\u0935\u0939\u0928',
  [GrievanceCategory.RATION_CARD_PDS]: '\u0930\u093E\u0936\u0928 \u0915\u093E\u0930\u094D\u0921 / PDS',
  [GrievanceCategory.PENSION_WELFARE]: '\u092A\u0947\u0902\u0936\u0928 \u0914\u0930 \u0915\u0932\u094D\u092F\u093E\u0923',
  [GrievanceCategory.CORRUPTION_MISCONDUCT]: '\u092D\u094D\u0930\u0937\u094D\u091F\u093E\u091A\u093E\u0930 \u0914\u0930 \u0915\u0926\u093E\u091A\u093E\u0930',
  [GrievanceCategory.BUILDING_CONSTRUCTION]: '\u092D\u0935\u0928 \u0914\u0930 \u0928\u093F\u0930\u094D\u092E\u093E\u0923',
  [GrievanceCategory.PARKS_PUBLIC_SPACES]: '\u092A\u093E\u0930\u094D\u0915 \u0914\u0930 \u0938\u093E\u0930\u094D\u0935\u091C\u0928\u093F\u0915 \u0938\u094D\u0925\u0932',
};

export const CATEGORY_BASE_SEVERITY: Record<GrievanceCategory, number> = {
  [GrievanceCategory.WATER_SUPPLY]: 80,
  [GrievanceCategory.ELECTRICITY]: 75,
  [GrievanceCategory.ROADS_POTHOLES]: 60,
  [GrievanceCategory.SANITATION_GARBAGE]: 65,
  [GrievanceCategory.DRAINAGE_SEWAGE]: 85,
  [GrievanceCategory.STREET_LIGHTING]: 40,
  [GrievanceCategory.PUBLIC_TRANSPORT]: 35,
  [GrievanceCategory.RATION_CARD_PDS]: 90,
  [GrievanceCategory.PENSION_WELFARE]: 85,
  [GrievanceCategory.CORRUPTION_MISCONDUCT]: 70,
  [GrievanceCategory.BUILDING_CONSTRUCTION]: 50,
  [GrievanceCategory.PARKS_PUBLIC_SPACES]: 30,
};

export const CATEGORY_DEPARTMENT_MAP: Record<GrievanceCategory, string> = {
  [GrievanceCategory.WATER_SUPPLY]: 'Water Supply',
  [GrievanceCategory.ELECTRICITY]: 'Electricity',
  [GrievanceCategory.ROADS_POTHOLES]: 'Roads & Infrastructure',
  [GrievanceCategory.SANITATION_GARBAGE]: 'Sanitation',
  [GrievanceCategory.DRAINAGE_SEWAGE]: 'Drainage',
  [GrievanceCategory.STREET_LIGHTING]: 'Street Lighting',
  [GrievanceCategory.PUBLIC_TRANSPORT]: 'Public Transport',
  [GrievanceCategory.RATION_CARD_PDS]: 'Revenue & Welfare',
  [GrievanceCategory.PENSION_WELFARE]: 'Revenue & Welfare',
  [GrievanceCategory.CORRUPTION_MISCONDUCT]: 'Revenue & Welfare',
  [GrievanceCategory.BUILDING_CONSTRUCTION]: 'Roads & Infrastructure',
  [GrievanceCategory.PARKS_PUBLIC_SPACES]: 'Sanitation',
};

export const CATEGORY_COLORS: Record<GrievanceCategory, string> = {
  [GrievanceCategory.WATER_SUPPLY]: '#3B82F6',
  [GrievanceCategory.ELECTRICITY]: '#F59E0B',
  [GrievanceCategory.ROADS_POTHOLES]: '#EF4444',
  [GrievanceCategory.SANITATION_GARBAGE]: '#10B981',
  [GrievanceCategory.DRAINAGE_SEWAGE]: '#6366F1',
  [GrievanceCategory.STREET_LIGHTING]: '#F97316',
  [GrievanceCategory.PUBLIC_TRANSPORT]: '#8B5CF6',
  [GrievanceCategory.RATION_CARD_PDS]: '#EC4899',
  [GrievanceCategory.PENSION_WELFARE]: '#14B8A6',
  [GrievanceCategory.CORRUPTION_MISCONDUCT]: '#DC2626',
  [GrievanceCategory.BUILDING_CONSTRUCTION]: '#78716C',
  [GrievanceCategory.PARKS_PUBLIC_SPACES]: '#22C55E',
};
