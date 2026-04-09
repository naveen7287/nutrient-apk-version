export interface Nutrition {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface ScanResult {
  food_name: string;
  ingredients: string[];
  nutrition: Nutrition;
  confidence: number;
  health_recommendation?: {
    should_consume: boolean;
    reason: string;
  };
  error?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthIssues: string;
  unit: 'metric' | 'imperial';
  targets: Nutrition;
}

export interface MealLog {
  id: string;
  timestamp: string;
  food_name: string;
  ingredients: string[];
  nutrition: Nutrition;
  type: 'homemade' | 'restaurant' | 'manual';
}

export interface DailyTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
