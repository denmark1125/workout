
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal, DietLog } from "../types.ts";
import { logAiTransaction } from "./dbService.ts";

const MODEL_STD_TEXT = 'gemini-3-flash-preview'; 
const MODEL_PREMIUM = 'gemini-3-pro-preview'; 
const MODEL_VISION = 'gemini-2.5-flash-image'; 

const getAIInstance = () => {
  // Always use process.env.API_KEY for the Gemini API key as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Added missing testConnection export for system health checks
export const testConnection = async (): Promise<boolean> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: 'Connection test. Respond with "ok".',
    });
    return !!response.text;
  } catch (e) {
    console.error("AI connection test failed", e);
    return false;
  }
};

export const getLocalDavidGreeting = (profile: UserProfile): string => {
  const now = new Date();
  const hour = now.getHours();
  let timeLabel = "深夜行動中";
  if (hour >= 5 && hour < 11) timeLabel = "晨間校準";
  else if (hour >= 11 && hour < 14) timeLabel = "午間戰備";
  else if (hour >= 14 && hour < 17) timeLabel = "下午補給";
  else if (hour >= 17 && hour < 22) timeLabel = "晚間衝刺";
  const name = profile.name || "學員";
  return `[${timeLabel}] ${name}，我是 David。今日焦點：「${GoalMetadata[profile.goal].focus}」。`;
};

export const getDailyBriefing = async (streak: number, userId: string): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業戰略指揮官 David。學員已連續登入 ${streak} 天。請給予一段簡短建議（約 40 字）。繁體中文。`;
  try {
    const response = await ai.models.generateContent({ model: MODEL_STD_TEXT, contents: prompt });
    logAiTransaction(userId, MODEL_STD_TEXT, 'Daily Briefing');
    return response.text || "維持紀律。數據不會騙人。";
  } catch (e) {
    logAiTransaction(userId, MODEL_STD_TEXT, 'Daily Briefing', 'FAIL');
    return "保持專注，進化正在發生。";
  }
};

export const getPhysiqueAnalysis = async (image: string, profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
  const textPart = { text: `你是一位專業健身戰略官 David。分析此學員體態。目標:${GoalMetadata[profile.goal].label}。繁體中文。` };
  try {
    const response = await ai.models.generateContent({ model: MODEL_VISION, contents: { parts: [imagePart, textPart] } });
    logAiTransaction(profile.memberId, MODEL_VISION, 'Physique Analysis');
    return response.text || "視覺模組離線。";
  } catch (e) {
    logAiTransaction(profile.memberId, MODEL_VISION, 'Physique Analysis', 'FAIL');
    throw e;
  }
};

export const generateWeeklyReport = async (profile: UserProfile, metrics: UserMetrics[], logs: WorkoutLog[], physiqueRecords: PhysiqueRecord[]): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業戰略官 David。分析本週數據生成戰術總結。目標:${GoalMetadata[profile.goal].label}。繁體中文。`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_PREMIUM,
      contents: prompt,
      config: { systemInstruction: "頂尖教練 David。語言精準、專業。", thinkingConfig: { thinkingBudget: 15000 } }
    });
    logAiTransaction(profile.memberId, MODEL_PREMIUM, 'Weekly Report');
    return response.text || "週報生成超時。";
  } catch (e) {
    logAiTransaction(profile.memberId, MODEL_PREMIUM, 'Weekly Report', 'FAIL');
    throw e;
  }
};

export const analyzeFoodImages = async (images: string[], profile: UserProfile) => {
  const ai = getAIInstance();
  const imageParts = images.map(img => ({ inlineData: { mimeType: 'image/jpeg', data: img.split(',')[1] || img } }));
  const promptPart = { text: "識別圖中所有食物。估算熱量與三大營養素。JSON Array。" };
  try {
    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: { parts: [...imageParts, promptPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              servingEstimate: { type: Type.STRING },
              macros: { type: Type.OBJECT, properties: { calories: { type: Type.INTEGER }, protein: { type: Type.INTEGER }, carbs: { type: Type.INTEGER }, fat: { type: Type.INTEGER } }, required: ["calories", "protein", "carbs", "fat"] },
            },
            required: ["name", "servingEstimate", "macros"],
          }
        },
      },
    });
    logAiTransaction(profile.memberId, MODEL_VISION, 'Food Multi-Analysis');
    return JSON.parse(response.text || "[]");
  } catch (e) {
    logAiTransaction(profile.memberId, MODEL_VISION, 'Food Multi-Analysis', 'FAIL');
    return [];
  }
};

export const calculateAiNutritionPlan = async (weight: number, height: number, age: number, gender: 'M' | 'F' | 'O', activity: ActivityLevel, goal: FitnessGoal, preference: DietaryPreference, userId: string) => {
  const ai = getAIInstance();
  const prompt = `你是專業營養官 David。計算建議：體重: ${weight}kg, 目標: ${GoalMetadata[goal].label}。JSON。`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { dailyCalorieTarget: { type: Type.INTEGER }, macroTargets: { type: Type.OBJECT, properties: { protein: { type: Type.INTEGER }, carbs: { type: Type.INTEGER }, fat: { type: Type.INTEGER } }, required: ["protein", "carbs", "fat"] }, advice: { type: Type.STRING } },
          required: ["dailyCalorieTarget", "macroTargets", "advice"],
        },
      },
    });
    logAiTransaction(userId, MODEL_STD_TEXT, 'Nutrition Calibration');
    return JSON.parse(response.text || "null");
  } catch (e) {
    logAiTransaction(userId, MODEL_STD_TEXT, 'Nutrition Calibration', 'FAIL');
    return null;
  }
};

export const getAiMealRecommendation = async (profile: UserProfile, metrics: UserMetrics[], cravings: string, healthFocus: string): Promise<string> => {
  const ai = getAIInstance();
  const latestMetric = metrics[metrics.length - 1] || { weight: 75, bodyFat: 20 };
  const prompt = `美食營養師 David。目標: ${GoalMetadata[profile.goal].label}。想吃: "${cravings}"。健康點: "${healthFocus}"。繁體中文建議。`;
  try {
    const response = await ai.models.generateContent({ model: MODEL_STD_TEXT, contents: prompt });
    logAiTransaction(profile.memberId, MODEL_STD_TEXT, 'Meal Recommendation');
    return response.text || "David 目前正在品嘗美食，請稍後再試。";
  } catch (e) {
    logAiTransaction(profile.memberId, MODEL_STD_TEXT, 'Meal Recommendation', 'FAIL');
    return "連線不穩，無法獲取美食建議。";
  }
};
