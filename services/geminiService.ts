
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal } from "../types";

const MODEL_STD_TEXT = 'gemini-3-flash-preview'; 
const MODEL_PREMIUM = 'gemini-3-pro-preview'; 

const getAIInstance = () => {
  // 1. 取得變數
  const apiKey = import.meta.env.VITE_WORKOUT_GEMINI_API;
  
  // 2. 檢查是否存在，避免後續 GoogleGenAI 初始化失敗
  if (!apiKey) {
    console.error("Critical Error: VITE_WORKOUT_GEMINI_API is undefined.");
    throw new Error("系統配置錯誤：缺少 AI API 金鑰");
};

// 專業且鼓勵的系統指令
const DAVID_PERSONA = `你是一位名叫 David 的頂尖專業健身教練。
你的性格特點：專業、嚴謹、具有同理心、正向積極。
你絕對不會使用毒舌、羞辱或過於犀利的措辭來打擊學員。
你的目標是提供精準的科學建議，並在學員遇到瓶頸時給予溫暖而堅定的鼓勵。
請使用台灣繁體中文與台灣健身房常用術語。`;

export const getDavidGreeting = async (profile: UserProfile): Promise<string> => {
  const now = new Date();
  const hour = now.getHours();
  let timeLabel = "深夜";
  if (hour >= 5 && hour < 11) timeLabel = "早安";
  else if (hour >= 11 && hour < 14) timeLabel = "午安";
  else if (hour >= 14 && hour < 17) timeLabel = "下午好";
  else if (hour >= 17 && hour < 22) timeLabel = "晚安";

  return `${timeLabel}！巨巨，我是 David。很高興看到你準時上線。今天的訓練準備好了嗎？我們一起突破極限！`;
};

/** Added local synchronous greeting to avoid unnecessary API calls for static text */
export const getLocalDavidGreeting = (profile: UserProfile): string => {
  const now = new Date();
  const hour = now.getHours();
  let timeLabel = "深夜";
  if (hour >= 5 && hour < 11) timeLabel = "早安";
  else if (hour >= 11 && hour < 14) timeLabel = "午安";
  else if (hour >= 14 && hour < 17) timeLabel = "下午好";
  else if (hour >= 17 && hour < 22) timeLabel = "晚安";

  return `${timeLabel}！${profile.name}巨巨，我是 David。很高興看到你準時上線。今天的訓練準備好了嗎？我們一起突破極限！`;
};

export const getPhysiqueAnalysis = async (image: string, profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  const textPart = {
    text: `${DAVID_PERSONA}\n請分析此學員的體態。請從肌肉發展、體脂分佈提供專業建議，並給予激勵性的回饋。`,
  };
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, textPart] },
  });
  return response.text || "目前連線不穩定，但我相信你最近的訓練一定很有成效。";
};

export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `
    ${DAVID_PERSONA}
    請為學員 ${profile.name} 生成本週戰略報告。
    目標：${GoalMetadata[profile.goal].label}。
    請分析進度並給出下週的具體優化建議，保持語氣專業且正面。
  `;
  
  const response = await ai.models.generateContent({
    model: MODEL_PREMIUM,
    contents: prompt,
    config: { systemInstruction: DAVID_PERSONA }
  });
  return response.text || "報告生成中發生異常，請先專注於基礎訓練，我稍後再為你分析。";
};

export const analyzeFoodImage = async (image: string, profile: UserProfile) => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  const textPart = {
    text: "識別圖片中的食物並估計重量與營養含量。回傳 JSON 格式。",
  };
  
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, textPart] },
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

/** Added missing testConnection function for Admin Panel */
export const testConnection = async (role?: string): Promise<boolean> => {
  if (role !== 'admin') return false;
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: 'ping',
    });
    return !!response.text;
  } catch (e) {
    return false;
  }
};

/** Added missing AI nutrition planning function */
export const calculateAiNutritionPlan = async (
  weight: number,
  height: number,
  age: number,
  gender: string,
  activity: number,
  goal: FitnessGoal,
  preference: DietaryPreference
) => {
  const ai = getAIInstance();
  const prompt = `你是一位專業健身教練 David。請根據以下數據計算每日熱量目標與三大營養素（蛋白質、碳水、脂肪，單位克）。
  體重: ${weight}kg, 身高: ${height}cm, 年齡: ${age}, 性別: ${gender}, 活動量: ${activity}, 目標: ${goal}, 飲食偏好: ${preference}。
  請以 JSON 格式回傳包含 dailyCalorieTarget, macroTargets (protein, carbs, fat) 與 advice。`;

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
    console.error("AI Calculation Error:", e);
    return null;
  }
};

/** Added missing daily briefing function for daily reward modal */
export const getDailyBriefing = async (streak: number): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `學員已連續登入 ${streak} 天。請以 David 教練的身份，給予一段簡短、專業且具有激勵性的今日戰術簡報（約 50 字）。`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
    });
    return response.text || "";
  } catch (e) {
    return "";
  }
};
