
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal } from "../types";

// --- Models ---
const MODEL_STD_TEXT = "gemini-3-flash-preview"; 
const MODEL_STD_VISION = "gemini-2.5-flash-image";
const MODEL_PREMIUM = "gemini-3-pro-preview"; 

// 輔助函數：獲取 AI 實例
const getAIInstance = () => {
  const apiKey = import.meta.env.VITE_WORKOUT_GEMINI_API;
  if (!apiKey) {
    console.error("Critical Error: VITE_WORKOUT_GEMINI_API not found.");
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey });
};

// 獲取當前時段與季節 (在地化邏輯)
const getTimeAndSeasonContext = () => {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;
  
  let timeLabel = "深夜";
  if (hour >= 5 && hour < 11) timeLabel = "早安";
  else if (hour >= 11 && hour < 14) timeLabel = "午安";
  else if (hour >= 14 && hour < 17) timeLabel = "下午好";
  else if (hour >= 17 && hour < 22) timeLabel = "晚安";

  let seasonLabel = "冬季";
  if (month >= 3 && month <= 5) seasonLabel = "春季";
  else if (month >= 6 && month <= 8) seasonLabel = "夏季";
  else if (month >= 9 && month <= 11) seasonLabel = "秋季";

  return { timeLabel, seasonLabel, hour };
};

/**
 * 本地 David 教練語料庫 (不消耗 AI)
 */
export const getLocalDavidGreeting = (profile: UserProfile): string => {
  const { timeLabel, seasonLabel, hour } = getTimeAndSeasonContext();
  const name = profile.name || "巨巨";
  const goal = GoalMetadata[profile.goal]?.label || "自我突破";

  const morningQuotes = [`${name}，早起的巨巨才有泵感。`, `空腹訓練要注意血糖，今天練哪？`, `早安，紀律就是最強的補劑。`];
  const lunchQuotes = [`午安 ${name}，蛋白質補了嗎？`, `中午練一波，充血感帶回辦公室。`, `記得多喝水，夏天訓練代謝快。`];
  const eveningQuotes = [`${name}，這時間來練的都是硬核。`, `練腿日到了，別想逃避。`, `晚上收操要做足，修復才是成長的開始。`];
  const nightQuotes = [`${name}，睡眠也是訓練的一部分。`, `深夜別吃宵夜，來份酪蛋白吧。`, `今天破 PR 了嗎？早點休息。`];

  let pool = eveningQuotes;
  if (hour >= 5 && hour < 11) pool = morningQuotes;
  else if (hour >= 11 && hour < 14) pool = lunchQuotes;
  else if (hour >= 22 || hour < 5) pool = nightQuotes;

  const randomQuote = pool[Math.floor(Math.random() * pool.length)];
  return `${timeLabel}！${randomQuote}`;
};

/**
 * AI 版本問候 (保留作戰略分析，但 App.tsx 預設改用本地)
 */
export const getDavidGreeting = async (profile: UserProfile): Promise<string> => {
  // 使用本地邏輯作為快速回傳，或整合 AI
  return getLocalDavidGreeting(profile);
};

export const getDailyBriefing = async (profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: `作為 David 教練，為學員 ${profile.name} 提供一段今日戰術簡報。目標：${GoalMetadata[profile.goal].label}。語氣專業、強悍且使用台灣健身術語。不超過 40 字。`,
  });
  return response.text || "戰術已確認。專注於每一次收縮，今天別想逃避練腿。";
};

export const getPhysiqueAnalysis = async (image: string, profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };
  const textPart = {
    text: `分析此學員的體態。學員資訊：${profile.gender === 'M' ? '男性' : '女性'}，${profile.age}歲，${profile.height}cm。目標：${GoalMetadata[profile.goal].label}。請使用專業教練 David 的語氣，提供條列式分析與建議，包含肌肉發展與體脂估計。請使用繁體中文。`,
  };
  const response = await ai.models.generateContent({
    model: MODEL_STD_VISION,
    contents: { parts: [imagePart, textPart] },
  });
  return response.text || "診斷模組異常。";
};

export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `
    生成一份詳細的戰略週報。
    使用者：${profile.name}。目標：${GoalMetadata[profile.goal].label}。
    生理數據：${JSON.stringify(metrics.slice(-5))}
    訓練日誌：${JSON.stringify(logs.slice(-10).map(l => ({ date: l.date, focus: l.focus, duration: l.durationMinutes })))}
    
    請以 David 教練的視角，分析進度、指出瓶頸，並給出下週 3 個具體行動點。風格要硬核且專業。使用繁體中文。
  `;
  
  const response = await ai.models.generateContent({
    model: MODEL_PREMIUM,
    contents: prompt,
    config: {
      systemInstruction: "你是一位名為 David 的頂尖健身分析師，說話精準且具有權威感。",
    }
  });
  return response.text || "報告分析失敗。";
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
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: `計算營養目標：體重 ${weight}kg, 身高 ${height}cm, 年齡 ${age}, 性別 ${gender}, 活動等級 ${activity}, 目標 ${goal}, 飲食偏好 ${preference}。請回傳繁體中文建議。`,
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

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
};

export const testConnection = async (role: string): Promise<boolean> => {
  if (role !== 'admin') return false;
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: "ping",
    });
    return !!response.text;
  } catch {
    return false;
  }
};

export const analyzeFoodImage = async (image: string, profile: UserProfile) => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };
  const textPart = {
    text: "識別圖片中的食物並估計重量與營養含量（熱量、蛋白質、碳水、脂肪）。",
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

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
};
