
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, DietaryPreference, ActivityLevel, FitnessGoal } from "../types.ts";

const MODEL_STD_TEXT = 'gemini-3-flash-preview'; 
const MODEL_PREMIUM = 'gemini-3-pro-preview'; 

const getAIInstance = () => {
  // 在 Vite 中，必須使用 import.meta.env 並指定 apiKey 屬性
  const apiKey = import.meta.env.VITE_WORKOUT_GEMINI_API;
  
  if (!apiKey) {
    console.error("David 教練警告：偵測不到通訊密鑰 (API Key)，請檢查環境變數。");
  }
  
  return new GoogleGenAI(apiKey);
};

export const getLocalDavidGreeting = (profile: UserProfile): string => {
  const now = new Date();
  const hour = now.getHours();
  let timeLabel = "深夜行動中";
  if (hour >= 5 && hour < 11) timeLabel = "晨間校準完畢";
  else if (hour >= 11 && hour < 14) timeLabel = "午間戰備狀態";
  else if (hour >= 14 && hour < 17) timeLabel = "下午補給時段";
  else if (hour >= 17 && hour < 22) timeLabel = "晚間衝刺開始";

  const name = profile.name || "學員";
  return `[SYSTEM ACTIVE] ${timeLabel}，${name}。我是戰略官 David。今日焦點：「${GoalMetadata[profile.goal].focus}」。記住，數據不會騙人，唯有紀律能帶領你走向進化。`;
};

export const getDailyBriefing = async (streak: number): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業戰略指揮官 David。學員已連續登入 ${streak} 天。請給予一段簡短、具備軍事戰略權威感且專業的分析建議（約 50 字）。語氣應冷靜、堅定、具備溫度。這是一個健身、養生、增肌減脂通用的 App。使用台灣繁體中文，避免嘲諷，要像一個真正關心學員進步、超級帥氣的指揮官。`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_STD_TEXT,
      contents: prompt,
    });
    return response.text || "維持戰術紀律。專注於每一次的收縮與呼吸。數據將證明你的價值。";
  } catch (e) {
    return "系統掃描中。保持專注，今日的每一克努力都將計入未來的進化矩陣。";
  }
};

export const getPhysiqueAnalysis = async (image: string, profile: UserProfile): Promise<string> => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  const textPart = {
    text: `你是一位頂尖專業健身戰略官 David。請以客觀、精準、權威且極具啟發性的語氣分析此學員體態。性別:${profile.gender}, 目標:${GoalMetadata[profile.goal].label}。
    請從肌肉平衡、脂肪分佈估計與戰術優化方向提供專業建議。你的目標是幫助學員超越自我，身歷其境地引導他們看到自己的進步。使用台灣繁體中文。`,
  };
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, textPart] },
  });
  return response.text || "視覺分析模組暫時離線。持續訓練，數據終將呈現。";
};

export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
): Promise<string> => {
  const ai = getAIInstance();
  const prompt = `你是專業戰略官 David。請分析學員本週數據生成戰術總結。學員:${profile.name}, 目標:${GoalMetadata[profile.goal].label}。本週訓練紀錄數:${logs.length}。
  請以高階戰術分析的專業口吻，評估進步曲線。內容應具備啟發性與專業度，語氣應溫暖而堅定，像是一個親身帶領學員訓練的超級帥氣教練。指出未來一週的優化死角。使用台灣繁體中文。`;
  
  const response = await ai.models.generateContent({
    model: MODEL_PREMIUM,
    contents: prompt,
    config: { 
      systemInstruction: "你是一位頂尖專業健身教練 David。你的語言簡潔、精準、富有權威感且高度專業。你致力於學員的全面進化，不管是增肌、減脂還是健康養生。你是他們的戰略夥伴，而非冰冷的程式。",
      thinkingConfig: { thinkingBudget: 15000 }
    }
  });
  return response.text || "週報生成模組執行超時。保持目前的戰略路徑。";
};

export const analyzeFoodImage = async (image: string, profile: UserProfile) => {
  const ai = getAIInstance();
  const base64Data = image.split(',')[1] || image;
  const imagePart = {
    inlineData: { mimeType: 'image/jpeg', data: base64Data },
  };
  
  const response = await ai.models.generateContent({
    model: MODEL_STD_TEXT,
    contents: { parts: [imagePart, { text: "精確識別圖中補給物及其份量。估計總熱量與三大營養素。回傳 JSON 格式。你目前是專業營養戰略官 David，幫助不同健身目標的學員掌控補給。" }] },
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

export const testConnection = async (role?: string): Promise<boolean> => {
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
  const prompt = `你是一位專業營養戰略官 David。請精確計算此學員資訊：
  體重: ${weight}kg, 身高: ${height}cm, 年齡: ${age}, 性別: ${gender}, 
  活動量: ${activity}, 目標: ${GoalMetadata[goal].label}, 偏好: ${preference}。
  請以專業且具備溫度的導師語氣回傳建議，並包含精確的 JSON 數據。`;

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
    return null;
  }
};
