
export enum FitnessGoal {
  FAT_LOSS = 'FAT_LOSS',           // 極限減脂 (著重代謝與有氧)
  TONING = 'TONING',               // 美體塑形 (女性/線條，著重比例)
  HYPERTROPHY = 'HYPERTROPHY',     // 鋼鐵增肌 (著重力量與體積)
  STRENGTH = 'STRENGTH',           // 力量突破 (著重爆發力)
  ENDURANCE = 'ENDURANCE',         // 耐力與心肺 (著重循環與有氧)
  CUSTOM = 'CUSTOM'
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

export interface WorkoutExercise {
  id: string;
  name: string;
  weight: number;
  reps: number;
  sets: number;
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
}

export interface PhysiqueRecord {
  id: string;
  date: string;
  image: string; 
  analysis: string;
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
  hasCompletedOnboarding?: boolean; // 新增：是否完成新手教學
}

export interface CalculatedData {
  bmi: number;
  bmr: number;
  ffmi: number;
  score: number;
}
