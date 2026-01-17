
export enum FitnessGoal {
  FAT_LOSS = 'FAT_LOSS',
  TONING = 'TONING',
  HYPERTROPHY = 'HYPERTROPHY',
  STRENGTH = 'STRENGTH',
  ENDURANCE = 'ENDURANCE',
  CUSTOM = 'CUSTOM'
}

export enum DietaryPreference {
  OMNIVORE = 'OMNIVORE',
  CARNIVORE = 'CARNIVORE',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  PESCATARIAN = 'PESCATARIAN',
  KETOGENIC = 'KETOGENIC'
}

export enum ActivityLevel {
  SEDENTARY = 1.2,
  LIGHT = 1.375,
  MODERATE = 1.55,
  ACTIVE = 1.725,
  ATHLETE = 1.9
}

export const GoalMetadata = {
  [FitnessGoal.FAT_LOSS]: { label: '極限減脂', focus: '熱量赤字與心肺代謝', persona: '專業戰略家' },
  [FitnessGoal.TONING]: { label: '美體塑形', focus: '身體線條與核心平衡', persona: '精密導引型' },
  [FitnessGoal.HYPERTROPHY]: { label: '鋼鐵增肌', focus: '漸進超負荷與肥大', persona: '剛毅導師型' },
  [FitnessGoal.STRENGTH]: { label: '力量突破', focus: '三大項神經肌肉效率', persona: '數據分析師' },
  [FitnessGoal.ENDURANCE]: { label: '有氧耐力', focus: '循環訓練與心肺抗壓', persona: '耐力策略師' },
  [FitnessGoal.CUSTOM]: { label: '自訂健身', focus: '用戶自定義目標', persona: '全方位顧問' },
};

export interface UserMetrics {
  id: string;
  date: string;
  weight: number; 
  bodyFat: number; 
  muscleMass: number;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  unit: string;
  macros: MacroNutrients;
  category: 'STAPLE' | 'PROTEIN' | 'VEG' | 'DRINK' | 'SNACK' | 'CONVENIENCE';
  source?: string;
  barcode?: string;
  createdBy?: string;
  isPending?: boolean;
}

export interface MealRecord {
  id: string;
  name: string;
  image?: string;
  macros: MacroNutrients;
  timestamp: string;
  servings: number; // 份數
  portionLabel?: string; // 例如 "1小把", "0.5份"
}

export interface DietLog {
  id: string;
  date: string;
  meals: {
    breakfast: MealRecord[];
    lunch: MealRecord[];
    dinner: MealRecord[];
    snack: MealRecord[];
    nightSnack: MealRecord[];
  };
  waterIntake: number;
}

export type ExerciseType = 'STRENGTH' | 'CARDIO';

export interface WorkoutExercise {
  id: string;
  type: ExerciseType;
  name: string;
  weight: number;
  reps: number;
  sets: number;
  durationMinutes?: number;
  distance?: number;
  caloriesBurned?: number;
}

export interface WorkoutLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  focus: string;
  feedback?: string;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  totalCaloriesBurned?: number;
}

export interface PhysiqueRecord {
  id: string;
  date: string;
  image: string;
  analysis: string;
}

export interface WeeklyReportData {
  id: string;
  weekId: string;
  date: string;
  content: string;
}

export interface UserProfile {
  name: string;
  gender: 'M' | 'F' | 'O';
  age: number;
  height: number;
  goal: FitnessGoal;
  customGoalText?: string;
  equipment?: string[];
  customEquipmentPool?: string[];
  loginStreak?: number;
  lastLoginDate?: string;
  memberId: string;
  password?: string;
  collectedRewardIds?: number[];
  unlockedAchievementIds?: string[];
  dietaryPreference?: DietaryPreference;
  activityLevel?: ActivityLevel;
  privacySettings?: {
    syncPhysiqueImages: boolean; 
    syncMetrics: boolean;        
  };
  dailyCalorieTarget?: number; 
  macroTargets?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  role?: 'admin' | 'user';
  lastDailyFeedbackDate?: string;
  lastPhysiqueAnalysisDate?: string;
  weeklyReportUsage?: { weekId: string; count: number };
  hasCompletedOnboarding?: boolean;
}

export interface CalculatedData {
  bmi: number;
  bmr: number;
  ffmi: number;
  score: number;
}
