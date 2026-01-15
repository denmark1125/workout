
export enum FitnessGoal {
  FAT_LOSS = 'FAT_LOSS',
  HYPERTROPHY = 'HYPERTROPHY',
  GOLDEN_RATIO = 'GOLDEN_RATIO',
  STRENGTH = 'STRENGTH',
  ENDURANCE = 'ENDURANCE',
  CUSTOM = 'CUSTOM'
}

export const GoalMetadata = {
  [FitnessGoal.FAT_LOSS]: { label: '極限減脂', focus: '熱量赤字與 NEAT' },
  [FitnessGoal.HYPERTROPHY]: { label: '鋼鐵增肌', focus: '漸進式超負荷與蛋白質' },
  [FitnessGoal.GOLDEN_RATIO]: { label: 'V型黃金比例', focus: '闊背肌與三角肌孤立' },
  [FitnessGoal.STRENGTH]: { label: '力量突破', focus: '大重量複合動作' },
  [FitnessGoal.ENDURANCE]: { label: '耐力與線條', focus: '訓練密度與循環訓練' },
  [FitnessGoal.CUSTOM]: { label: '自訂戰略', focus: '用戶自定義目標' },
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
  image: string; // Base64
  analysis: string;
}

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  goal: FitnessGoal;
  customGoalText?: string;
  equipment?: string[];
  customEquipmentPool?: string[];
}

export interface CalculatedData {
  bmi: number;
  bmr: number;
  ffmi: number;
  score: number;
}

// --- 管理員系統新增 ---
export interface LoginLog {
  memberId: string;
  timestamp: string;
  userAgent: string;
}

export interface UserRegistryEntry {
  memberId: string;
  lastActive: string;
  status: 'ACTIVE' | 'BANNED';
}
