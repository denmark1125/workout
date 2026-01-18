
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal } from "../types.ts";

const MODEL_STD_TEXT = 'gemini-3-flash-preview'; 
const MODEL_PREMIUM = 'gemini-3-pro-preview'; 

// Correct initialization as per SDK guidelines using process.env.API_KEY exclusively.
const getAIInstance = () => {
  // Always use process.env.API_KEY for the Gemini API client initialization
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_WORKOUT_GEMINI_API });
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

export const getDailyBriefing = async (streak: number): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業戰略指揮官 David。學員已連續登入 ${streak} 天。請給予一段簡短、專業的分析建議（約 40 字）。語氣應冷靜、堅定。使用台灣繁體中文。`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
    });
    return response.text || "維持紀律。數據不會騙人。";
  } catch (e) {
    return "保持專注，進化正在發生。";
  }
};

export const getPhysiqueAnalysis = async (image: string, profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  const textPart = {
    text: `你是一位專業健身戰略官 David。分析此學員體態。目標:${GoalMetadata[profile.goal].label}。提供戰術優化建議。使用台灣繁體中文。`,
  };
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, textPart] },
  });
  return response.text || "視覺模組離線。";
};

export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業戰略官 David。分析本週數據生成戰術總結。目標:${GoalMetadata[profile.goal].label}。使用台灣繁體中文。`;
  
  const response = await ai.models.generateContent({
    model: MODEL_PREMIUM,
    contents: prompt,
    config: { 
      systemInstruction: "你是一位頂尖專業健身教練 David。語言精準、專業。你致力於學員全面進化。",
      thinkingConfig: { thinkingBudget: 15000 }
    }
  });
  return response.text || "週報生成超時。";
};

export const analyzeFoodImage = async (image: string, profile: UserProfile) => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, { text: "識別圖中食物及份量，估計熱量與三大營養素。回傳 JSON。" }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          macros: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.INTEGER },
              protein: { type: Type.INTEGER },
              carbs: { type: Type.INTEGER },
              fat: { type: Type.INTEGER },
            },
            required: ["calories", "protein", "carbs", "fat"],
          },
        },
        required: ["name", "macros"],
      },
    },
  });

  return JSON.parse(response.text || "null");
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const ai = getAIInstance();
    await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: "ping",
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const calculateAiNutritionPlan = async (
  weight: number,
  height: number,
  age: number,
  gender: 'M' | 'F' | 'O',
  activity: ActivityLevel,
  goal: FitnessGoal,
  preference: DietaryPreference
) => {
  const ai = getAIInstance();
  const prompt = `你是專業營養官 David。計算建議：體重: ${weight}kg, 身高: ${height}cm, 目標: ${GoalMetadata[goal].label}。回傳 JSON。`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyCalorieTarget: { type: Type.INTEGER },
            macroTargets: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.INTEGER },
                carbs: { type: Type.INTEGER },
                fat: { type: Type.INTEGER },
              },
              required: ["protein", "carbs", "fat"],
            },
            advice: { type: Type.STRING },
          },
          required: ["dailyCalorieTarget", "macroTargets", "advice"],
        },
      },
    });

    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
};
