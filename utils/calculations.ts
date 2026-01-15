
import { UserProfile, UserMetrics, CalculatedData } from '../types';

export const calculateMatrix = (profile: UserProfile, metric: UserMetrics): CalculatedData => {
  const heightM = profile.height / 100;
  
  // BMI
  const bmi = metric.weight / (heightM * heightM);
  
  // BMR (Mifflin-St Jeor)
  const bmr = 10 * metric.weight + 6.25 * profile.height - 5 * profile.age + 5;
  
  // FFMI (Fat Free Mass Index)
  const leanMass = metric.weight * (1 - (metric.bodyFat / 100));
  const ffmiRaw = leanMass / (heightM * heightM);
  const ffmi = ffmiRaw + 6.1 * (1.8 - heightM);
  
  // Fitness Score
  const muscleScore = (metric.muscleMass / metric.weight) * 100;
  const bodyFatScore = Math.max(0, 100 - (metric.bodyFat - 10) * 4);
  const score = (muscleScore * 0.4 + bodyFatScore * 0.3 + (ffmi / 25) * 30);

  return { bmi, bmr, ffmi, score };
};

export const getRadarData = (profile: UserProfile, metric: UserMetrics, calculated: CalculatedData) => {
  return [
    { subject: '肌肉量', A: Math.min(100, (metric.muscleMass / (metric.weight * 0.6)) * 100), fullMark: 100 },
    { subject: '體脂率', A: Math.min(100, (30 - metric.bodyFat) * 4), fullMark: 100 },
    { subject: '綜合評分', A: Math.min(100, calculated.score), fullMark: 100 },
    { subject: 'FFMI', A: Math.min(100, (calculated.ffmi / 25) * 100), fullMark: 100 },
    { subject: '成長潛力', A: 85, fullMark: 100 },
  ];
};
