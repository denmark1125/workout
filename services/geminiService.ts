
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, FitnessGoal, PhysiqueRecord, MacroNutrients, DietaryPreference } from "../types";
import { getTaiwanDate, getTaiwanWeekId } from "../utils/calculations";

// 輔助函數：安全獲取 AI 實例
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Gatekeeper Logic (資源控管) ---

interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

const checkAccess = (type: 'daily' | 'physique' | 'weekly', profile: UserProfile): AccessCheckResult => {
  const today = getTaiwanDate();
  const currentWeek = getTaiwanWeekId();
  
  // Admin Bypass (Root Access)
  if (profile.role === 'admin') return { allowed: true };

  switch (type) {
    case 'daily':
      if (profile.lastDailyFeedbackDate === today) {
        return { allowed: false, reason: "Daily limit reached" };
      }
      return { allowed: true };
      
    case 'physique':
      if (profile.lastPhysiqueAnalysisDate === today) {
        return { allowed: false, reason: "Physique scan limited to once per day" };
      }
      return { allowed: true };
      
    case 'weekly':
      if (profile.weeklyReportUsage?.weekId === currentWeek) {
        if (profile.weeklyReportUsage.count >= 2) {
          return { allowed: false, reason: "Weekly report limit (2/week) reached" };
        }
      }
      return { allowed: true };
      
    default:
      return { allowed: false };
  }
};

// --- Token Pruning (資料修剪) ---

const pruneLogs = (logs: WorkoutLog[]) => {
  return logs.map(l => ({
    d: l.date,
    f: l.focus, // Focus
    e: l.exercises.map(ex => `${ex.name}:${ex.weight}kgx${ex.reps}x${ex.sets}`).join('|') // Compact format
  }));
};

const SYSTEM_INSTRUCTION = `
你現在是「David 教練」，The Matrix 系統的首席戰略官。
語氣：冷靜、專業、戰場直覺、台灣健身術語、激勵人心。
限制：回答簡潔有力，禁止冗長廢話。
`;

// --- Public API Functions ---

/**
 * 測試 AI 連線狀態 (僅限 Admin)
 */
export const testConnection = async (role: string = 'user'): Promise<boolean> => {
  if (role !== 'admin') {
    console.warn("Access Denied: Non-admin attempted uplink test.");
    return false;
  }
  
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: "Ping",
    });
    return !!response.text;
  } catch (error) {
    console.error("AI Core Uplink Failed:", error);
    return false;
  }
};

/**
 * David 教練：首頁常駐問候 (本地邏輯，不消耗 Token)
 */
export const getDavidGreeting = async (profile: UserProfile): Promise<string> => {
  const hour = new Date().getHours();
  const nameToUse = (profile.name && profile.name !== 'User') 
    ? profile.name 
    : '執行者';

  let quotes: string[] = [];
  if (hour >= 5 && hour < 11) quotes = [`早安，${nameToUse}。清晨適合專注，執行任務吧。`, `一日之計在於晨。${nameToUse}，喚醒神經連結。`];
  else if (hour >= 11 && hour < 14) quotes = [`午安，${nameToUse}。別忘了燃料補充。`, `正午時分，保持代謝運轉。`];
  else if (hour >= 14 && hour < 18) quotes = [`下午好，${nameToUse}。生理機能高峰，挑戰極限。`, `專注在你能控制的事情上。`];
  else if (hour >= 18 && hour < 23) quotes = [`晚上好，${nameToUse}。用汗水洗淨思緒。`, `卸下防備，這裡只有你和重量。`];
  else quotes = [`夜深了，${nameToUse}。修復是變強的關鍵，早點休息。`, `堅持很孤獨，但這是強者的路。`];

  return `David 教練：${quotes[Math.floor(Math.random() * quotes.length)]}`;
};

/**
 * 食物辨識與營養分析
 */
export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; macros: MacroNutrients } | null> => {
  try {
    const ai = getAIInstance();
    const prompt = `
      辨識圖中食物。
      回傳 JSON 格式：
      {
        "name": "食物名稱 (繁體中文)",
        "calories": 總熱量(整數),
        "protein": 蛋白質克數(整數),
        "carbs": 碳水化合物克數(整數),
        "fat": 脂肪克數(整數)
      }
      若無法辨識，回傳 null。不要有任何 Markdown 標記，直接回傳 JSON 字串。
    `;
    
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1] || base64Image,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: { temperature: 0.1 }
    });

    const text = response.text?.trim() || "";
    // 移除可能的 markdown code block
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Food Analysis Failed", error);
    return null;
  }
};

/**
 * 獲取今日訓練反饋 (Daily Feedback)
 */
export const getDailyFeedback = async (profile: UserProfile, todayLog: WorkoutLog): Promise<string> => {
  const today = getTaiwanDate();
  const cacheKey = `matrix_feedback_${profile.memberId}_${today}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const access = checkAccess('daily', profile);
  if (!access.allowed) {
    return "David 教練：今日戰術分析已完成。專注休息，明日再戰。";
  }

  const logSummary = `${todayLog.startTime}-${todayLog.endTime} Focus:${todayLog.focus}. Ex:${todayLog.exercises.map(e => `${e.name}:${e.weight}kg`).join(',')}. Note:${todayLog.feedback || 'None'}`;
  
  const prompt = `
    學員：${profile.name} (目標:${GoalMetadata[profile.goal].label})
    今日訓練：${logSummary}
    任務：給予一段短評 (50字內)，包含肯定與一個具體建議。
  `;

  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
    });
    
    const result = response.text?.trim() || "David 教練：今日表現穩健。";
    localStorage.setItem(cacheKey, result);
    return result;

  } catch (error: any) {
    if (error.message?.includes('429')) {
       return "David 教練：系統運算量過載。你的努力我看到了，今天的訓練強度很棒，保持下去。";
    }
    return "David 教練：資料鏈路不穩，但你的訓練數據已安全封存。";
  }
};

/**
 * 視覺診斷 (Physique Analysis)
 */
export const getPhysiqueAnalysis = async (imageBase64: string, profile: UserProfile) => {
  const access = checkAccess('physique', profile);
  if (!access.allowed) {
    return "### 🚫 存取限制\n\nDavid 教練：視覺診斷模組每日僅能啟動一次。過度頻繁的檢測無助於成長，請專注於訓練本身。";
  }

  const meta = GoalMetadata[profile.goal];
  const goalStr = profile.goal === FitnessGoal.CUSTOM ? profile.customGoalText : meta.label;

  const prompt = `
    學員：${profile.name} (${profile.gender})
    目標：${goalStr}
    任務：分析體態視覺特徵、弱點、戰術建議。Markdown 條列式。
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64.split(',')[1] || imageBase64,
    },
  };

  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: { parts: [imagePart, { text: prompt }] },
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
    });
    return response.text || "David 教練：目前無法解析該體態數據。";
  } catch (error: any) {
    if (error.message?.includes('429')) return "### ⚠️ 系統忙碌\n\nDavid 教練：視覺核心目前滿載。請稍後再試。";
    return `### ⚠️ 系統連線異常\n\nDavid 教練：無法連接至視覺核心。`;
  }
};

/**
 * 戰略週報 (Weekly Report)
 */
export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
) => {
  const access = checkAccess('weekly', profile);
  if (!access.allowed) {
    return "### 🚫 存取限制\n\nDavid 教練：戰略週報每週僅限生成兩次。過度依賴數據分析而忽略執行是兵家大忌。請下週再來。";
  }

  const prunedMetrics = metrics.slice(-7).map(m => `${m.date}:${m.weight}kg/${m.bodyFat}%`).join('\n');
  const prunedLogs = pruneLogs(logs.slice(-7)).map(l => `${l.d}[${l.f}]:${l.e}`).join('\n');

  const dietPrefStr = profile.dietaryPreference ? `飲食偏好：${profile.dietaryPreference}` : '';

  const prompt = `
    目標：${GoalMetadata[profile.goal].label}
    ${dietPrefStr}
    體重體脂：\n${prunedMetrics}
    本週訓練：\n${prunedLogs}
    任務：生成週報。包含戰術評估、動作優化、飲食建議（請根據飲食偏好調整食物建議，例如素食者多推豆類）。
  `;

  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    let outputText = response.text || "David 教練：週報分析中，請稍候。";
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (sources && sources.length > 0) {
      outputText += "\n\n---\n**戰略參考：**\n";
      sources.forEach((chunk: any) => {
        if (chunk.web?.uri) outputText += `- [${chunk.web.title || 'Source'}](${chunk.web.uri})\n`;
      });
    }
    return outputText;
  } catch (error: any) {
    if (error.message?.includes('429')) return "### ⚠️ 流量管制\n\nDavid 教練：戰略指揮部目前通訊繁忙。請稍後再索取報告。";
    return `### ⚠️ 生成失敗\n\nDavid 教練：系統離線。`;
  }
};

/**
 * 每日獎勵簡報
 */
export const getDailyBriefing = async (profile: UserProfile, streak: number): Promise<string> => {
  const prompt = `連續登入第 ${streak} 天。目標：${GoalMetadata[profile.goal].label}。給一句簡短肯定。`;
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.9 }
    });
    return response.text?.trim() || `"${profile.name}，你的堅持是系統最強大的演算法。"`;
  } catch (error) {
    return `"${profile.name}，你的堅持是系統最強大的演算法。"`;
  }
};
