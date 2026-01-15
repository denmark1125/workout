
import { UserProfile, UserMetrics, CalculatedData } from '../types';

export interface MatrixStatus {
  label: string;
  color: string;
}

export const getLocalTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getBMIStatus = (bmi: number): MatrixStatus => {
  if (bmi < 18.5) return { label: '過輕', color: 'border-blue-200 text-blue-400 bg-blue-50/10' };
  if (bmi < 24) return { label: '標準', color: 'border-lime-200 text-lime-500 bg-lime-50/10' };
  if (bmi < 27) return { label: '過重', color: 'border-orange-200 text-orange-400 bg-orange-50/10' };
  return { label: '肥胖', color: 'border-red-200 text-red-400 bg-red-50/10' };
};

export const getFFMIStatus = (ffmi: number): MatrixStatus => {
  if (ffmi < 18) return { label: '一般', color: 'border-gray-200 text-gray-400 bg-gray-50/10' };
  if (ffmi < 20) return { label: '體格', color: 'border-blue-100 text-blue-400 bg-blue-50/10' };
  if (ffmi < 22) return { label: '精銳', color: 'border-lime-200 text-lime-500 bg-lime-50/10' };
  if (ffmi < 25) return { label: '極限', color: 'border-purple-200 text-purple-400 bg-purple-50/10' };
  return { label: '異常', color: 'border-red-200 text-red-400 bg-red-50/10' };
};

export const calculateMatrix = (profile: UserProfile, metric: UserMetrics): CalculatedData => {
  const heightM = (profile.height || 175) / 100;
  const weight = metric.weight || 75;
  const bodyFat = metric.bodyFat || 15;
  const isFemale = profile.gender === 'F';
  
  const bmi = weight / (heightM * heightM);
  
  // BMR: Mifflin-St Jeor Equation
  const bmrBase = 10 * weight + 6.25 * (profile.height || 175) - 5 * (profile.age || 25);
  const bmr = isFemale ? bmrBase - 161 : bmrBase + 5;
  
  const leanMass = weight * (1 - (bodyFat / 100));
  const ffmiRaw = leanMass / (heightM * heightM);
  const ffmi = ffmiRaw + 6.1 * (1.8 - heightM);
  
  const muscleMass = metric.muscleMass || 35;
  const muscleScore = (muscleMass / weight) * 100;
  
  // Body fat scoring adjusted for gender (Women have naturally higher fat)
  const targetFat = isFemale ? 22 : 12;
  const bodyFatScore = Math.max(0, 100 - Math.abs(bodyFat - targetFat) * 4);
  
  const score = (muscleScore * 0.4 + bodyFatScore * 0.3 + (ffmi / 25) * 30);

  return { bmi, bmr, ffmi, score };
};

export const getRadarData = (profile: UserProfile, metric: UserMetrics, calculated: CalculatedData) => {
  const isFemale = profile.gender === 'F';
  return [
    { subject: '肌肉量', A: Math.min(100, (metric.muscleMass / (metric.weight * (isFemale ? 0.45 : 0.6))) * 100), fullMark: 100 },
    { subject: '體脂效率', A: Math.min(100, (isFemale ? 40 : 30) - metric.bodyFat) * (isFemale ? 2.5 : 3.3), fullMark: 100 },
    { subject: '健身評分', A: Math.min(100, calculated.score), fullMark: 100 },
    { subject: 'FFMI', A: Math.min(100, (calculated.ffmi / (isFemale ? 22 : 25)) * 100), fullMark: 100 },
    { subject: '進步潛力', A: 85, fullMark: 100 },
  ];
};
