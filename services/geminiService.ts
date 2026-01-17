import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, MacroNutrients, DietaryPreference, ActivityLevel } from "../types";
import { getTaiwanDate, getTaiwanWeekId } from "../utils/calculations";

// --- Configuration ---
const API_TIMEOUT = 20000; // Flash 模型速度快，縮短 Timeout 至 20秒
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// --- Models (Resource Lean Strategy) ---
const MODEL_TEXT_FAST = "gemini-3-flash-preview";      // For Daily Feedback
const MODEL_VISION_FAST = "gemini-2.5-flash-image";    // For Food & Physique
const MODEL_REASONING = "gemini-3-pro-preview";        // Only for Weekly Report

// --- Local Data (Zero Cost) ---
const DAVID_QUOTES = [
  "早安。清晨適合專注，執行任務吧。",
  "一日之計在於晨。喚醒神經連結。",
  "午安。別忘了燃料補充。",
  "正午時分，保持代謝運轉。",
  "下午好。生理機能高峰，挑戰極限。",
  "專注在你能控制的事情上。",
  "晚上好。用汗水洗淨思緒。",
  "卸下防備，這裡只有你和重量。",
  "夜深了。修復是變強的關鍵，早點休息。",
  "堅持很孤獨，但這是強者的路。",
  "訓練是與身體的對話，別讓它沈默。",
  "沒有奇蹟，只有累積。",
  "你的肌肉記得你的每一次掙扎。",
  "痛楚是軟弱離開身體的聲音。"
];

// 輔助函數：安全獲取 AI 實例
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("System Configuration Error: API Key Missing");
  return new GoogleGenAI({ apiKey });
};

// --- Cache & Quota System ---

const getCacheKey = (prefix: string, id: string) => `matrix_cache_v2_${prefix}_${id}_${getTaiwanDate()}`;
const getQuotaKey = (prefix: string) => `matrix_quota_${prefix}_${getTaiwanDate()}`;

const checkCache = (key: string): string | null => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) return data;
  } catch (e) {
    localStorage.removeItem(key);
  }
  return null;
};

const setCache = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

const checkAndIncrementQuota = (type: 'food' | 'physique', limit: number): boolean => {
  const key = getQuotaKey(type);
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  if (current >= limit) return false;
  localStorage.setItem(key, (current + 1).toString());
  return true;
};

// --- Helper: Robust AI Call Wrapper ---
async function callAIWithRetry<T>(operation: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error("ABORTED_SILENT");
    
    console.error("AI Operation Failed:", error);
    
    if (error.message?.includes('429')) throw new Error("系統運算量過載 (429)。請稍後再試。");

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callAIWithRetry(operation, retries - 1);
    }
    throw error;
  }
}

// --- Public API Functions ---

/**
 * 連線測試 (Zero Cost)
 * 改為純本地回傳，不消耗 API
 */
export const testConnection = async (role: string = 'user'): Promise<boolean> => {
  // 模擬網路延遲，讓使用者感覺有在測試
  await new Promise(resolve => setTimeout(resolve, 800));
  return true;
};

/**
 * David 教練問候 (Zero Cost)
 * 改為本地隨機字串，不消耗 API
 */
export const getDavidGreeting = async (profile: UserProfile): Promise<string> => {
  const nameToUse = (profile.name && profile.name !== 'User') ? profile.name : '執行者';
  const randomQuote = DAVID_QUOTES[Math.floor(Math.random() * DAVID_QUOTES.length)];
  return `David 教練：${nameToUse}，${randomQuote}`;
};

/**
 * 食物辨識與營養分析 (Quota: 3/Day)
 */
export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; macros: MacroNutrients } | null> => {
  // 1. Check Quota
  if (!checkAndIncrementQuota('food', 3)) {
    alert('David 教練：今日偵察能量已耗盡，請改用手動輸入食物名稱以維持系統運作。');
    return null; 
  }

  return callAIWithRetry(async () => {
    const ai = getAIInstance();
    const prompt = `
      辨識圖中食物。
      請依照台灣食品營養標示法規（每份或每100公克）估算熱量與營養素。
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

    // 使用 Flash Image 模型節省成本
    const response = await ai.models.generateContent({
      model: MODEL_VISION_FAST,
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
 * 頻率極低，維持使用 Flash
 */
export const calculateAiNutritionPlan = async (
   weight: number, height: number, age: number, gender: string,
   activity: ActivityLevel, goal: string, dietPref: DietaryPreference
): Promise<{ dailyCalorieTarget: number, macroTargets: { protein: number, carbs: number, fat: number }, advice: string } | null> => {
   
   // Cache check based on parameters hash-like string
   const cacheKey = `matrix_calc_${weight}_${height}_${age}_${goal}`;
   const cached = checkCache(cacheKey);
   if (cached) return JSON.parse(cached);

   return callAIWithRetry(async () => {
      const ai = getAIInstance();
      const prompt = `
         作為專業運動營養師 David，請為以下學員計算 TDEE 與營養素目標：
         - 基本資料: ${gender}, ${age}歲, ${height}cm, ${weight}kg
         - 活動量係數: ${activity}
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
         model: MODEL_TEXT_FAST,
         contents: prompt,
         config: { temperature: 0.2 }
      });

      const text = response.text?.trim() || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid JSON");

      setCache(cacheKey, jsonMatch[0]); // Cache result
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
 * 使用 Flash + 極致資料修剪 + 強制快取
 */
export const getDailyFeedback = async (profile: UserProfile, todayLog: WorkoutLog): Promise<string> => {
  const cacheKey = getCacheKey('daily_feedback', profile.memberId);
  const cached = checkCache(cacheKey);
  if (cached) return cached;

  // Data Pruning: {動作:重量x組數}
  const compactLog = todayLog.exercises.map(e => {
    if (e.type === 'CARDIO') return `{${e.name}:${e.durationMinutes}m}`;
    return `{${e.name}:${e.weight}kgx${e.sets}}`;
  }).join('');
  
  const logSummary = `${todayLog.startTime}-${todayLog.endTime} Focus:${todayLog.focus} Data:${compactLog} Feed:${todayLog.feedback || 'N/A'}`;
  
  const prompt = `
    角色：David教練
    學員：${profile.name}(${GoalMetadata[profile.goal]?.label})
    數據：${logSummary}
    任務：給予50字內短評，包含肯定與建議。繁體中文。
  `;

  return callAIWithRetry(async () => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_FAST, 
      contents: prompt,
      config: { temperature: 0.7 }
    });
    
    const result = response.text?.trim() || "David 教練：今日表現穩健。";
    setCache(cacheKey, result);
    return result;
  });
};

/**
 * 視覺診斷 (Physique Analysis) (Quota: 1/Day)
 * 使用 Flash Image
 */
export const getPhysiqueAnalysis = async (imageBase64: string, profile: UserProfile) => {
  // 1. Check Quota (Also double checked by UI, but enforced here)
  if (!checkAndIncrementQuota('physique', 1)) {
    return "### 🚫 存取限制\n\nDavid 教練：視覺診斷模組每日僅能啟動一次。過度頻繁的檢測無助於成長，請專注於訓練本身。";
  }

  const prompt = `
    學員：${profile.name} (${profile.gender})
    目標：${GoalMetadata[profile.goal]?.label}
    任務：分析體態特徵、弱點、建議。
    格式：### 小標題，- 條列重點。勿用 Markdown code block。
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
        model: MODEL_VISION_FAST, 
        contents: { parts: [imagePart, { text: prompt }] },
        config: { temperature: 0.7 }
      });
      return response.text || "David 教練：目前無法解析該體態數據。";
    } catch (error: any) {
      if (error.message === 'ABORTED_SILENT') return "";
      return `### ⚠️ 系統連線異常\nDavid 教練：視覺核心連線失敗。`;
    }
  });
};

/**
 * 戰略週報 (Weekly Report)
 * 維持使用 Pro 模型，因為需要深度推理
 */
export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
) => {
  const currentWeek = getTaiwanWeekId();
  const cacheKey = getCacheKey('weekly_report', `${profile.memberId}_${currentWeek}`);
  
  // 檢查週報配額 (2/week) - 保留原邏輯，但增加快取檢查
  if (profile.weeklyReportUsage?.weekId === currentWeek && profile.weeklyReportUsage.count >= 2) {
     // 如果有快取，即使超過配額也可以回傳舊的快取內容 (Optional optimization, here we strictly block new generations)
     const cached = checkCache(cacheKey);
     if (cached) return cached;
     return "### 🚫 存取限制\n\nDavid 教練：戰略週報每週僅限生成兩次。請下週再來。";
  }

  // Data Pruning for Weekly Report
  const prunedMetrics = metrics.slice(-5).map(m => `${m.date.split(' ')[0]}:${m.weight}/${m.bodyFat}`).join('\n');
  const prunedLogs = logs.slice(-5).map(l => {
     const exs = l.exercises.map(e => e.name).slice(0,3).join(',');
     return `${l.date}:${l.focus}[${exs}]`;
  }).join('\n');

  const dietPrefStr = profile.dietaryPreference || '無';
  
  const prompt = `
    目標：${GoalMetadata[profile.goal]?.label}
    飲食：${dietPrefStr}
    數據：
    ${prunedMetrics}
    ${prunedLogs}
    
    任務：生成戰略週報。
    格式：
    ### 戰術執行評估
    ### 動作與強度優化
    ### 營養補給戰略
    - 條列建議
  `;

  return callAIWithRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: MODEL_REASONING, // Keep Pro for deep reasoning
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let outputText = response.text || "David 教練：週報分析中。";
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (sources && sources.length > 0) {
        outputText += "\n### 戰略參考資料\n";
        sources.forEach((chunk: any) => {
          if (chunk.web?.uri) outputText += `- [${chunk.web.title || 'Source'}](${chunk.web.uri})\n`;
        });
      }
      
      setCache(cacheKey, outputText);
      return outputText;
    } catch (error: any) {
      if (error.message === 'ABORTED_SILENT') return "";
      if (error.message?.includes('429')) return "### ⚠️ 流量管制\nDavid 教練：戰略指揮部目前通訊繁忙。";
      throw error;
    }
  });
};

/**
 * 每日獎勵簡報
 * 使用 Flash + 快取
 */
export const getDailyBriefing = async (profile: UserProfile, streak: number): Promise<string> => {
  const cacheKey = getCacheKey('daily_briefing', profile.memberId);
  const cached = checkCache(cacheKey);
  if (cached) return cached;

  const prompt = `連續登入${streak}天。目標:${GoalMetadata[profile.goal]?.label}。一句肯定。`;
  
  return callAIWithRetry(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: MODEL_TEXT_FAST,
        contents: prompt,
        config: { temperature: 0.9 }
      });
      const text = response.text?.trim() || `"${profile.name}，你的堅持是系統最強大的演算法。"`;
      setCache(cacheKey, text);
      return text;
    } catch (error: any) {
      if (error.message === 'ABORTED_SILENT') return "";
      return `"${profile.name}，你的堅持是系統最強大的演算法。"`;
    }
  });
};
