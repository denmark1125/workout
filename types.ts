
export enum FitnessGoal {
  FAT_LOSS = 'FAT_LOSS',
  TONING = 'TONING',
  HYPERTROPHY = 'HYPERTROPHY',
  STRENGTH = 'STRENGTH',
  ENDURANCE = 'ENDURANCE',
  CUSTOM = 'CUSTOM'
}

export enum DietaryPreference {
  OMNIVORE = 'OMNIVORE',       // 雜食 (均衡)
  CARNIVORE = 'CARNIVORE',     // 肉食為主
  VEGETARIAN = 'VEGETARIAN',   // 蛋奶素
  VEGAN = 'VEGAN',             // 全素
  PESCATARIAN = 'PESCATARIAN', // 海鮮素
  KETOGENIC = 'KETOGENIC'      // 生酮
}

export enum ActivityLevel {
  SEDENTARY = 1.2,      // 幾乎不運動
  LIGHT = 1.375,        // 每週 1-3 次
  MODERATE = 1.55,      // 每週 3-5 次
  ACTIVE = 1.725,       // 每週 6-7 次
  ATHLETE = 1.9         // 每天重訓+有氧
}

export const GoalMetadata = {
  [FitnessGoal.FAT_LOSS]: { label: '極限減脂', focus: '熱量赤字與心肺代謝', persona: '紀律型' },
  [FitnessGoal.TONING]: { label: '美體塑形', focus: '身體線條與核心平衡', persona: '精準型' },
  [FitnessGoal.HYPERTROPHY]: { label: '鋼鐵增肌', focus: '漸進超負荷與肥大', persona: '硬核型' },
  [FitnessGoal.STRENGTH]: { label: '力量突破', focus: '三大項神經肌肉效率', persona: '權威型' },
  [FitnessGoal.ENDURANCE]: { label: '有氧耐力', focus: '循環訓練與心肺抗壓', persona: '激勵型' },
  [FitnessGoal.CUSTOM]: { label: '自訂健身', focus: '用戶自定義目標', persona: '中性型' },
};

export interface UserMetrics {
  id: string;
  date: string;
  weight: number; 
  bodyFat: number; 
  muscleMass: number;
}

export type ExerciseType = 'STRENGTH' | 'CARDIO';

export interface WorkoutExercise {
  id: string;
  type?: ExerciseType; 
  name: string;
  
  // Strength Fields
  weight: number;
  reps: number;
  sets: number;
  
  // Cardio Fields
  durationMinutes?: number; 
  distance?: number; 
  caloriesBurned?: number; 
}

export interface WorkoutLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  focus?: string;
  feedback?: string; 
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  totalCaloriesBurned?: number; 
}

export interface PhysiqueRecord {
  id: string;
  date: string;
  image: string; 
  analysis: string;
  isLocalOnly?: boolean; 
}

// --- Diet Types ---

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
  id: string; // date string YYYY-MM-DD
  date: string;
  meals: {
    breakfast: MealRecord[];
    lunch: MealRecord[];
    dinner: MealRecord[];
    snack: MealRecord[];
    lateNight: MealRecord[];
  };
  waterIntake: number; // ml
}

export interface UserProfile {
  name: string;
  email?: string;
  gender: 'M' | 'F' | 'O';
  age: number;
  height: number;
  goal: FitnessGoal;
  customGoalText?: string;
  equipment?: string[];
  customEquipmentPool?: string[];
  lastLoginDate?: string;
  loginStreak?: number;
  memberId: string;
  password?: string;
  lastRewardClaimDate?: string;
  collectedRewardIds?: number[];
  unlockedAchievementIds?: string[];
  trainingPreference?: 'WEIGHTS' | 'CARDIO' | 'BALANCED';
  hasCompletedOnboarding?: boolean;
  
  // New Fields for Initialization
  dietaryPreference?: DietaryPreference;
  activityLevel?: ActivityLevel;

  // 隱私權設定
  privacySettings?: {
    syncPhysiqueImages: boolean; 
    syncMetrics: boolean;        
  };

  // Nutrition Targets
  dailyCalorieTarget?: number; 
  macroTargets?: {
    protein: number;
    carbs: number;
    fat: number;
  };

  // Gatekeeper & Role Fields
  role?: 'admin' | 'user';
  lastDailyFeedbackDate?: string;
  lastPhysiqueAnalysisDate?: string;
  weeklyReportUsage?: { 
    weekId: string;
    count: number; 
  };
}

export interface CalculatedData {
  bmi: number;
  bmr: number;
  ffmi: number;
  score: number;
}
