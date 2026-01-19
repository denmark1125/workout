
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal, DietLog } from "../types.ts";

const MODEL_STD_TEXT = 'gemini-3-flash-preview'; 
const MODEL_PREMIUM = 'gemini-3-pro-preview'; 
const MODEL_VISION = 'gemini-2.5-flash-image'; // Use vision optimized model

// Correct initialization as per SDK guidelines using process.env.API_KEY exclusively.
const getAIInstance = () => {
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
    model: MODEL_VISION,
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

// Updated: Supports multiple images and returns an array of food items
export const analyzeFoodImages = async (images: string[], profile: UserProfile) => {
  const ai = getAIInstance();
  
  const imageParts = images.map(img => ({
    inlineData: { 
      mimeType: 'image/jpeg', 
      data: img.split(',')[1] || img 
    },
  }));
  
  const promptPart = {
    text: "識別圖中所有食物。估算每樣食物的份量、熱量與三大營養素。若有多樣食物請分開列出。回傳 JSON Array。"
  };

  const response = await ai.models.generateContent({
    model: MODEL_VISION, // Using vision model for image analysis
    contents: { parts: [...imageParts, promptPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            servingEstimate: { type: Type.STRING, description: "例如: 1碗, 200g" },
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
          required: ["name", "servingEstimate", "macros"],
        }
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("AI Parse Error", e);
    return [];
  }
};

// Deprecated: Kept for backward compatibility if needed, but analyzeFoodImages is preferred
export const analyzeFoodImage = async (image: string, profile: UserProfile) => {
  const res = await analyzeFoodImages([image], profile);
  return res.length > 0 ? res[0] : null;
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

// New Function: AI Foodie Nutritionist
export const getAiMealRecommendation = async (
  profile: UserProfile, 
  metrics: UserMetrics[],
  cravings: string,
  healthFocus: string
): Promise<string> => {
  const ai = getAIInstance();
  const latestMetric = metrics[metrics.length - 1] || { weight: 75, bodyFat: 20 };
  
  const prompt = `
    你是一位懂吃又懂練的「美食營養師兼健身教練 David」。
    請根據以下用戶數據提供一份「即時飲食建議」。
    
    【用戶數據】
    - 暱稱: ${profile.name}
    - 目標: ${GoalMetadata[profile.goal].label}
    - 體重: ${latestMetric.weight}kg, 體脂: ${latestMetric.bodyFat}%
    - 每日熱量目標: ${profile.dailyCalorieTarget} kcal
    
    【關鍵參數】
    - 用戶想吃 (Cravings): "${cravings || '隨意，好吃的就好'}"
    - 健康關注點 (Health Focus): "${healthFocus || '無特別限制，維持體態'}"
    
    【你的任務】
    1. 扮演一位親切、生活化、有點幽默的朋友，不要使用過多艱澀的專業術語。
    2. 直接給出一份具體的「菜單建議」（可以是外食或簡單自煮）。
    3. 你的邏輯是「權衡」：如果用戶想吃炸雞但體脂高，不要只說不行，而是建議「去皮吃」或「搭配大量蔬菜」或「氣炸鍋/烤箱版本」。幫助他解決選擇障礙。
    4. 給出一個「推薦原因」，解釋為什麼這樣吃可以滿足他的嘴饞又能兼顧健康數據（例如：這樣配可以降升糖指數）。
    5. 格式要清晰好讀，適合手機閱讀。不要囉嗦。
    
    請使用台灣繁體中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
    });
    return response.text || "David 目前正在品嘗美食，請稍後再試。";
  } catch (e) {
    console.error(e);
    return "連線不穩，無法獲取美食建議。";
  }
};
