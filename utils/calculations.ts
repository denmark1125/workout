
import { UserProfile, UserMetrics, CalculatedData, ActivityLevel, FitnessGoal, DietaryPreference } from '../types';

export interface MatrixStatus {
  label: string;
  color: string;
}

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

// Fix: Added missing export of getTaiwanWeekId for weekly report tracking
export const getTaiwanWeekId = (): string => {
  const now = new Date();
  // Ensure we use Taipei time zone for calculating the current week
  const taipeiDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
  const date = new Date(taipeiDateStr);
  
  // ISO-8601 week number calculation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const getBMIStatus = (bmi: number): MatrixStatus => {
  if (bmi < 18.5) return { label: '過輕 (Underweight)', color: 'border-blue-200 text-blue-400' };
  if (bmi < 24) return { label: '標準 (Optimal)', color: 'border-lime-200 text-lime-500' };
  if (bmi < 27) return { label: '過重 (Overweight)', color: 'border-orange-200 text-orange-400' };
  return { label: '肥胖 (Obese)', color: 'border-red-200 text-red-400' };
};

export const getFFMIStatus = (ffmi: number, gender: 'M' | 'F' | 'O'): MatrixStatus => {
  const offset = gender === 'F' ? 3.5 : 0;
  const adjustedFfmi = ffmi + offset;
  if (adjustedFfmi < 18) return { label: '一般體格', color: 'text-gray-400 border-gray-100' };
  if (adjustedFfmi < 20) return { label: '運動基礎', color: 'text-blue-400 border-blue-100' };
  if (adjustedFfmi < 22) return { label: '精英運動員', color: 'text-lime-500 border-lime-200' };
  return { label: '頂尖巔峰', color: 'text-purple-500 border-purple-200' };
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
  const muscleMass = metric.muscleMass || (weight * (isFemale ? 0.35 : 0.45));
  const muscleScore = (muscleMass / weight) * 100;
  const targetFat = isFemale ? 22 : 12;
  const bodyFatScore = Math.max(0, 100 - Math.abs(bodyFat - targetFat) * 4);
  const score = (muscleScore * 0.4 + bodyFatScore * 0.3 + (ffmi / 25) * 30);
  return { bmi, bmr, ffmi, score };
};

export const getRadarData = (profile: UserProfile, metric: UserMetrics, calculated: CalculatedData) => {
  const isFemale = profile.gender === 'F';
  // 重新定義 5 個維度，確保與 UI 解說一致
  return [
    { subject: '肌肉負荷', full: '肌肉量', A: Math.min(100, (metric.muscleMass / (metric.weight * (isFemale ? 0.45 : 0.6))) * 100) },
    { subject: '定義精度', full: '體脂率', A: Math.max(0, Math.min(100, (isFemale ? 35 : 25) - metric.bodyFat) * (isFemale ? 3 : 4) + 50) },
    { subject: '結構潛力', full: 'FFMI', A: Math.min(100, (calculated.ffmi / (isFemale ? 20 : 25)) * 100) },
    { subject: '代謝引擎', full: 'BMR', A: Math.min(100, (calculated.bmr / 2200) * 100) },
    { subject: '核心戰力', full: '綜合評分', A: Math.min(100, calculated.score) },
  ];
};

export const calculateNutritionTargets = (
  weight: number, height: number, age: number, gender: 'M'|'F'|'O', activity: ActivityLevel, goal: FitnessGoal, preference: DietaryPreference
) => {
  const s = gender === 'F' ? -161 : 5;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s;
  const tdee = bmr * activity;
  let targetCalories = tdee;
  if (goal === FitnessGoal.FAT_LOSS) targetCalories = tdee * 0.8;
  if (goal === FitnessGoal.TONING) targetCalories = tdee * 0.9;
  if (goal === FitnessGoal.HYPERTROPHY) targetCalories = tdee * 1.1;
  if (goal === FitnessGoal.STRENGTH) targetCalories = tdee * 1.05;
  targetCalories = Math.round(targetCalories);
  const proteinGrams = Math.round(weight * (preference === DietaryPreference.KETOGENIC ? 1.8 : 2.0));
  const fatGrams = Math.round((targetCalories * (preference === DietaryPreference.KETOGENIC ? 0.7 : 0.3)) / 9);
  const carbGrams = Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);
  return { dailyCalorieTarget: targetCalories, macroTargets: { protein: proteinGrams, carbs: Math.max(0, carbGrams), fat: fatGrams } };
};
