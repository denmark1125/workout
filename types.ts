
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
  [FitnessGoal.FAT_LOSS]: { label: '極限減脂', focus: '熱量赤字與心肺代謝', persona: '專業鼓勵型' },
  [FitnessGoal.TONING]: { label: '美體塑形', focus: '身體線條與核心平衡', persona: '細緻導引型' },
  [FitnessGoal.HYPERTROPHY]: { label: '鋼鐵增肌', focus: '漸進超負荷與肥大', persona: '熱血同理型' },
  [FitnessGoal.STRENGTH]: { label: '力量突破', focus: '三大項神經肌肉效率', persona: '權威穩重型' },
  [FitnessGoal.ENDURANCE]: { label: '有氧耐力', focus: '循環訓練與心肺抗壓', persona: '耐力陪伴型' },
  [FitnessGoal.CUSTOM]: { label: '自訂健身', focus: '用戶自定義目標', persona: '全方位支援型' },
};

export interface UserMetrics {
  id: string;
  date: string;
  weight: number; 
  bodyFat: number; 
  muscleMass: number;
}

export interface FoodItem {
  id: string;
  name: string;
  unit: string;
  macros: MacroNutrients;
  category: string;
  source?: string;
  barcode?: string;
  createdBy?: string; // 用於管理員審核
  isPending?: boolean;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealRecord {
  id: string;
  name: string;
  image?: string;
  macros: MacroNutrients;
  timestamp: string;
}

export interface DietLog {
  id: string;
  date: string;
  meals: {
    breakfast: MealRecord[];
    lunch: MealRecord[];
    dinner: MealRecord[];
    snack: MealRecord[];
    nightSnack: MealRecord[]; // 修正名稱
  };
  waterIntake: number;
}

/** Added missing workout related types */
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

/** Added missing physique related types */
export interface PhysiqueRecord {
  id: string;
  date: string;
  image: string;
  analysis: string;
}

/** Added missing weekly report related types */
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
  /** Added missing tracking fields */
  weeklyReportUsage?: { weekId: string; count: number };
  hasCompletedOnboarding?: boolean;
}

export interface CalculatedData {
  bmi: number;
  bmr: number;
  ffmi: number;
  score: number;
}
