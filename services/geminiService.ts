
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal } from "../types.ts";

const MODEL_STD_TEXT = 'gemini-3-flash-preview'; 
const MODEL_PREMIUM = 'gemini-3-pro-preview'; 

const getAIInstance = () => {
  const apiKey = import.meta.env.VITE_WORKOUT_GEMINI_API;
  
  if (!apiKey) {
    console.error("Critical Error: VITE_WORKOUT_GEMINI_API not found.");
    throw new Error("系統配置錯誤：缺少 AI API 金鑰");
  }
  return new GoogleGenAI({ apiKey });
};

export const getLocalDavidGreeting = (profile: UserProfile): string => {
  const now = new Date();
  const hour = now.getHours();
  let timeLabel = "深夜";
  if (hour >= 5 && hour < 11) timeLabel = "早安";
  else if (hour >= 11 && hour < 14) timeLabel = "午安";
  else if (hour >= 14 && hour < 17) timeLabel = "下午好";
  else if (hour >= 17 && hour < 22) timeLabel = "晚安";

  const name = profile.name || "學員";
  return `${timeLabel}，${name}。我是戰略官 David。系統已準備就緒。今日的訓練目標是「${GoalMetadata[profile.goal].focus}」，讓我們以最高效的方式執行任務。`;
};

export const getDailyBriefing = async (streak: number): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業教練 David。學員已連續登入 ${streak} 天。請給予一段簡短、權威且專業的戰術分析建議（約 50 字）。語氣應冷靜、支持且客觀，不要嘲諷或過於毒舌。使用台灣繁體中文。`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
    });
    return response.text || "維持戰術紀律。專注於每一次的收縮與呼吸。";
  } catch (e) {
    return "系統掃描中。保持專注，今天也是進步的一環。";
  }
};

export const getPhysiqueAnalysis = async (image: string, profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  const textPart = {
    text: `你是一位專業健身戰略官 David。請以客觀、精準、權威且專業的語氣分析此學員體態。性別:${profile.gender}, 目標:${GoalMetadata[profile.goal].label}。
    請從肌肉發展對稱性、體脂估計與訓練方向提供建設性建議。請不要使用負面或打擊學員的詞彙，專注於解決方案。`,
  };
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, textPart] },
  });
  return response.text || "視覺分析模組暫時離線，請檢查網路連線。";
};

export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業教練 David。請根據學員的數據生成本週戰略總結。學員:${profile.name}, 目標:${GoalMetadata[profile.goal].label}。數據分析包含:${JSON.stringify(metrics.slice(-3))}。
  請以高級私人教練的專業口吻，分析其進步趨勢，指出可以優化的訓練死角。內容應具備啟發性與專業度，避免毒舌，使用台灣繁體中文。`;
  
  const response = await ai.models.generateContent({
    model: MODEL_PREMIUM,
    contents: prompt,
    config: { 
      systemInstruction: "你是一位頂尖專業健身教練 David。你的語言簡潔、精準、富有權威感且高度專業。",
      thinkingConfig: { thinkingBudget: 15000 }
    }
  });
  return response.text || "週報生成模組執行超時。";
};

export const analyzeFoodImage = async (image: string, profile: UserProfile) => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, { text: "精確識別圖中食物及其份量。估計總熱量與三大營養素。回傳 JSON 格式。" }] },
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

// 實作 testConnection 函數以修復 Settings.tsx 的錯誤
export const testConnection = async (role?: string): Promise<boolean> => {
  try {
    const ai = getAIInstance();
    await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: "ping",
    });
    return true;
  } catch (e) {
    console.error("AI 連線測試失敗:", e);
    return false;
  }
};

// 實作 calculateAiNutritionPlan 函數以修復 Settings.tsx 的錯誤
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
  const prompt = `你是一位專業營養師 David。請根據以下學員資訊計算精確的每日營養目標：
  體重: ${weight}kg, 身高: ${height}cm, 年齡: ${age}, 性別: ${gender}, 
  活動量: ${activity} (TDEE 倍率), 目標: ${GoalMetadata[goal].label}, 偏好: ${preference}。
  
  請回傳 JSON 格式，包含每日建議熱量、蛋白質、碳水、脂肪（克數），以及一段簡短的戰術建議。`;

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

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error("AI 營養計算失敗:", e);
    return null;
  }
};
