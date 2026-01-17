
import { UserProfile, UserMetrics, CalculatedData, ActivityLevel, FitnessGoal, DietaryPreference } from '../types';

export interface MatrixStatus {
  label: string;
  color: string;
}

/**
 * 取得當前台灣時間 (GMT+8)
 * 格式: YYYY-MM-DD HH:mm
 */
export const getLocalTimestamp = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat('zh-TW', options);
  const parts = formatter.formatToParts(now);
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
};

/**
 * 取得當前台灣日期
 * 格式: YYYY-MM-DD
 */
export const getTaiwanDate = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options); 
  return formatter.format(now);
};

/**
 * 取得當前台灣週次 ID
 */
export const getTaiwanWeekId = (): string => {
  const now = new Date();
  const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const date = new Date(taiwanTime.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

export const getBMIStatus = (bmi: number): MatrixStatus => {
  if (bmi < 18.5) return { label: '過輕 (Underweight)', color: 'border-blue-200 text-blue-400 bg-blue-50/10' };
  if (bmi < 24) return { label: '標準 (Optimal)', color: 'border-lime-200 text-lime-500 bg-lime-50/10' };
  if (bmi < 27) return { label: '過重 (Overweight)', color: 'border-orange-200 text-orange-400 bg-orange-50/10' };
  return { label: '肥胖 (Obese)', color: 'border-red-200 text-red-400 bg-red-50/10' };
};

export const getFFMIStatus = (ffmi: number, gender: 'M' | 'F' | 'O'): MatrixStatus => {
  const offset = gender === 'F' ? 3.5 : 0;
  const adjustedFfmi = ffmi + offset;
  if (adjustedFfmi < 18) return { label: '一般體格', color: 'border-gray-200 text-gray-400 bg-gray-50/10' };
  if (adjustedFfmi < 20) return { label: '運動基礎', color: 'border-blue-100 text-blue-400 bg-blue-50/10' };
  if (adjustedFfmi < 22) return { label: '精銳運動員', color: 'border-lime-200 text-lime-500 bg-lime-50/10' };
  if (adjustedFfmi < 25) return { label: '頂尖極限', color: 'border-purple-200 text-purple-400 bg-purple-50/10' };
  return { label: '巔峰/監測中', color: 'border-red-200 text-red-400 bg-red-50/10' };
};

export const calculateMatrix = (profile: UserProfile, metric: UserMetrics): CalculatedData => {
  const heightM = (profile.height || 175) / 100;
  const weight = metric.weight || 75;
  const bodyFat = metric.bodyFat || 15;
  const isFemale = profile.gender === 'F';
  
  const bmi = weight / (heightM * heightM);
  
  const bmrBase = 10 * weight + 6.25 * (profile.height || 175) - 5 * (profile.age || 25);
  const bmr = isFemale ? bmrBase - 161 : bmrBase + 5;
  
  const leanMass = weight * (1 - (bodyFat / 100));
  const ffmiRaw = leanMass / (heightM * heightM);
  const ffmi = ffmiRaw + 6.1 * (1.8 - heightM);
  
  const muscleMass = metric.muscleMass || 35;
  const muscleScore = (muscleMass / weight) * 100;
  
  const targetFat = isFemale ? 22 : 12;
  const bodyFatScore = Math.max(0, 100 - Math.abs(bodyFat - targetFat) * 4);
  
  const score = (muscleScore * 0.4 + bodyFatScore * 0.3 + (ffmi / 25) * 30);

  return { bmi, bmr, ffmi, score };
};

export const getRadarData = (profile: UserProfile, metric: UserMetrics, calculated: CalculatedData) => {
  const isFemale = profile.gender === 'F';
  const isFatLoss = profile.goal === 'FAT_LOSS';
  
  return [
    { subject: '肌肉量', A: Math.min(100, (metric.muscleMass / (metric.weight * (isFemale ? 0.45 : 0.6))) * 100), fullMark: 100 },
    { subject: '減脂效率', A: Math.min(100, (isFemale ? 40 : 30) - metric.bodyFat) * (isFemale ? 2.5 : 3.3), fullMark: 100 },
    { subject: '系統評分', A: Math.min(100, calculated.score), fullMark: 100 },
    { subject: 'FFMI 指標', A: Math.min(100, (calculated.ffmi / (isFemale ? 20 : 25)) * 100), fullMark: 100 },
    { subject: '進化潛力', A: isFatLoss ? 95 : 85, fullMark: 100 },
  ];
};

/**
 * 自動計算目標熱量與營養素 (TDEE Method)
 */
export const calculateNutritionTargets = (
  weight: number, 
  height: number, 
  age: number, 
  gender: 'M'|'F'|'O', 
  activity: ActivityLevel, 
  goal: FitnessGoal,
  preference: DietaryPreference
) => {
  // 1. Calculate BMR (Mifflin-St Jeor)
  const s = gender === 'F' ? -161 : 5;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s;

  // 2. Calculate TDEE
  const tdee = bmr * activity;

  // 3. Adjust for Goal
  let targetCalories = tdee;
  if (goal === FitnessGoal.FAT_LOSS) targetCalories = tdee * 0.8; // 20% deficit
  if (goal === FitnessGoal.TONING) targetCalories = tdee * 0.9; // 10% deficit
  if (goal === FitnessGoal.HYPERTROPHY) targetCalories = tdee * 1.1; // 10% surplus
  if (goal === FitnessGoal.STRENGTH) targetCalories = tdee * 1.05; // 5% surplus
  // Endurance & Custom ~ maintenance or slight surplus depending on load, keep maintenance default
  
  targetCalories = Math.round(targetCalories);

  // 4. Calculate Macros
  // Protein: High for muscle retention/growth. 
  // Base: 2g/kg (Standard fitness), adjusted slightly by diet
  let proteinRatio = 2.0; 
  if (preference === DietaryPreference.KETOGENIC) proteinRatio = 1.8; // KETO usually moderate protein high fat

  const proteinGrams = Math.round(weight * proteinRatio);
  const proteinCals = proteinGrams * 4;

  let remainingCals = targetCalories - proteinCals;

  // Fat & Carbs Split
  let fatRatio = 0.3; // Default 30% of total
  if (preference === DietaryPreference.KETOGENIC) fatRatio = 0.70; // High fat
  if (goal === FitnessGoal.FAT_LOSS) fatRatio = 0.35; // Slightly higher fat for satiety

  let fatCals = targetCalories * fatRatio;
  // If keto, we need to ensure carbs are very low
  if (preference === DietaryPreference.KETOGENIC) {
     const carbGrams = 30; // Hard limit
     const carbCals = carbGrams * 4;
     remainingCals = targetCalories - proteinCals - carbCals;
     fatCals = remainingCals;
  }
  
  let fatGrams = Math.round(fatCals / 9);
  let carbCals = targetCalories - proteinCals - (fatGrams * 9);
  let carbGrams = Math.round(carbCals / 4);

  // Safety checks for negative values
  if (carbGrams < 0) carbGrams = 0;

  return {
    dailyCalorieTarget: targetCalories,
    macroTargets: {
      protein: proteinGrams,
      carbs: carbGrams,
      fat: fatGrams
    }
  };
};
