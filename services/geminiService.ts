
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, MacroNutrients, DietaryPreference, ActivityLevel } from "../types";
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
格式要求：
1. 嚴格使用繁體中文。
2. 使用清晰的 Markdown 結構，但**不要**使用程式碼區塊 (Code Block)。
3. 重點可以使用 **粗體** 標示。
4. 條列式重點請使用 - 符號。
`;

// --- Helper: Robust AI Call Wrapper ---
async function callAIWithRetry<T>(operation: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error("AI Operation Failed:", error);
    
    // Handle AbortError / Timeout explicitly
    if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
       throw new Error("連線逾時。David 戰略官正在進行深度戰術推演，請檢查網路並稍後重試 (建議等待 60 秒)。");
    }

    if (retries > 0) {
      console.log(`Retrying AI operation... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      return callAIWithRetry(operation, retries - 1);
    }
    throw error;
  }
}

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
  return callAIWithRetry(async () => {
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
      若無法辨識，回傳 null。
      重要：只要回傳 JSON 字串，不要包含 \`\`\`json 或其他標記。
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       console.error("AI Response invalid format:", text);
       return null;
    }
    
    return JSON.parse(jsonMatch[0]);
  });
};

/**
 * AI 營養戰略校準 (Settings Calibration)
 */
export const calculateAiNutritionPlan = async (
   weight: number, height: number, age: number, gender: string,
   activity: ActivityLevel, goal: string, dietPref: DietaryPreference
): Promise<{ dailyCalorieTarget: number, macroTargets: { protein: number, carbs: number, fat: number }, advice: string } | null> => {
   return callAIWithRetry(async () => {
      const ai = getAIInstance();
      const prompt = `
         作為專業運動營養師 David，請為以下學員計算 TDEE 與營養素目標：
         - 基本資料: ${gender}, ${age}歲, ${height}cm, ${weight}kg
         - 活動量係數: ${activity} (1.2久坐, 1.375輕度, 1.55中度, 1.725高度, 1.9極限)
         - 訓練目標: ${goal}
         - 飲食偏好: ${dietPref}

         請回傳 JSON 格式 (不要 Markdown):
         {
            "tdee": 每日目標熱量(整數),
            "p": 蛋白質克數(整數),
            "c": 碳水克數(整數),
            "f": 脂肪克數(整數),
            "advice": "一句針對此目標與飲食偏好的簡短戰術建議 (繁體中文, 30字內)"
         }
      `;

      const response = await ai.models.generateContent({
         model: "gemini-3-flash-preview",
         contents: prompt,
         config: { temperature: 0.2 }
      });

      const text = response.text?.trim() || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid JSON");

      const data = JSON.parse(jsonMatch[0]);
      return {
         dailyCalorieTarget: data.tdee,
         macroTargets: {
            protein: data.p,
            carbs: data.c,
            fat: data.f
         },
         advice: data.advice
      };
   });
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
    學員：${profile.name} (目標:${GoalMetadata[profile.goal]?.label || profile.goal})
    今日訓練：${logSummary}
    任務：給予一段短評 (50字內)，包含肯定與一個具體建議。
  `;

  return callAIWithRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
    });
    
    const result = response.text?.trim() || "David 教練：今日表現穩健。";
    localStorage.setItem(cacheKey, result);
    return result;
  });
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
  const goalStr = profile.goal === 'CUSTOM' ? profile.customGoalText : meta?.label;

  const prompt = `
    學員：${profile.name} (${profile.gender})
    目標：${goalStr}
    任務：分析體態視覺特徵、弱點、戰術建議。
    格式要求：
    1. 使用 "###" 作為小標題 (如：### 視覺優勢、### 弱點分析)。
    2. 使用 "-" 作為條列重點。
    3. 嚴禁使用星號 (***) 或其他 Markdown 符號。
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64.split(',')[1] || imageBase64,
    },
  };

  return callAIWithRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: { parts: [imagePart, { text: prompt }] },
        config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
      });
      return response.text || "David 教練：目前無法解析該體態數據。";
    } catch (error: any) {
      if (error.message?.includes('429')) return "### ⚠️ 系統忙碌\nDavid 教練：視覺核心目前滿載。請稍後再試。";
      throw error;
    }
  });
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

  const dietPrefStr = profile.dietaryPreference ? `飲食偏好：${profile.dietaryPreference}` : '無特殊偏好';
  const activityStr = profile.activityLevel ? `活動量係數：${profile.activityLevel}` : '中等活動';

  const prompt = `
    目標：${GoalMetadata[profile.goal]?.label || profile.goal}
    ${dietPrefStr}, ${activityStr}
    體重體脂：\n${prunedMetrics}
    本週訓練：\n${prunedLogs}
    
    任務：生成一份專業的戰略週報。
    格式要求：
    1. 分為三個區塊，使用 "###" 開頭：
       ### 戰術執行評估
       ### 動作與強度優化
       ### 營養補給戰略
    2. 每個區塊下使用 "-" 條列具體建議。
    3. 針對 ${dietPrefStr} 給予具體食物建議 (例如素食者建議什麼蛋白質)。
    4. 嚴禁使用星號 (***) 或其他 Markdown 符號。
  `;

  return callAIWithRetry(async () => {
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
        outputText += "\n### 戰略參考資料\n";
        sources.forEach((chunk: any) => {
          if (chunk.web?.uri) outputText += `- [${chunk.web.title || 'Source'}](${chunk.web.uri})\n`;
        });
      }
      return outputText;
    } catch (error: any) {
      if (error.message?.includes('429')) return "### ⚠️ 流量管制\nDavid 教練：戰略指揮部目前通訊繁忙。請稍後再索取報告。";
      throw error;
    }
  });
};

/**
 * 每日獎勵簡報
 */
export const getDailyBriefing = async (profile: UserProfile, streak: number): Promise<string> => {
  const prompt = `連續登入第 ${streak} 天。目標：${GoalMetadata[profile.goal]?.label || profile.goal}。給一句簡短肯定。`;
  
  return callAIWithRetry(async () => {
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
  });
};
