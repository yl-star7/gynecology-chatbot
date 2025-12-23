export interface MedicalKnowledge {
  id: string;
  category: MedicalCategory;
  title: string;
  content: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  lastUpdated: Date;
  verifiedBy?: string;
  accuracy: number;
  language: 'ko' | 'en';
}

export type MedicalCategory = 
  | 'pregnancy'
  | 'prenatal-care'
  | 'postnatal-care'
  | 'fertility'
  | 'menstruation'
  | 'contraception'
  | 'menopause'
  | 'gynecological-diseases'
  | 'medications'
  | 'nutrition'
  | 'exercise'
  | 'mental-health'
  | 'emergency';

export interface SymptomChecker {
  symptoms: Symptom[];
  possibleConditions: Condition[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendations: string[];
}

export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  duration?: string;
  frequency?: string;
  location?: string;
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  probability: number;
  symptoms: string[];
  treatmentOptions: string[];
  whenToSeeDoctor: string;
}

export interface PregnancyTracker {
  userId: string;
  currentWeek: number;
  dueDate: Date;
  lastMenstrualPeriod: Date;
  babySize: string;
  babyWeight: string;
  weeklyDevelopment: string;
  motherChanges: string;
  recommendations: PregnancyRecommendation[];
  appointments: Appointment[];
}

export interface PregnancyRecommendation {
  category: 'nutrition' | 'exercise' | 'prenatal-care' | 'lifestyle';
  title: string;
  description: string;
  importance: 'optional' | 'recommended' | 'essential';
}

export interface Appointment {
  id: string;
  type: 'regular-checkup' | 'ultrasound' | 'blood-test' | 'specialist' | 'other';
  date: Date;
  doctor?: string;
  location?: string;
  notes?: string;
  reminderSet: boolean;
}

export interface MedicationInfo {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X';
  breastfeedingSafety: 'safe' | 'caution' | 'avoid' | 'contraindicated';
  description: string;
  dosage: string;
  sideEffects: string[];
  interactions: string[];
  warnings: string[];
}

export interface NutritionGuide {
  pregnancyWeek?: number;
  dailyCalories: number;
  nutrients: Nutrient[];
  foodsToAvoid: string[];
  recommendedFoods: string[];
  sampleMealPlan?: MealPlan;
}

export interface Nutrient {
  name: string;
  dailyAmount: string;
  importance: string;
  sources: string[];
}

export interface MealPlan {
  breakfast: string[];
  morningSnack?: string[];
  lunch: string[];
  afternoonSnack?: string[];
  dinner: string[];
  eveningSnack?: string[];
}