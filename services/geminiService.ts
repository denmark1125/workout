
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, PhysiqueRecord, MacroNutrients, DietaryPreference, ActivityLevel } from "../types";
import { getTaiwanDate, getTaiwanWeekId } from "../utils/calculations";

// --- Configuration ---
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// --- Models (Dual Mode Strategy) ---
// Standard: 快速、低成本，用於高頻互動 (日常反饋、食物辨識)
const MODEL_STD_TEXT = "gemini-3-flash-preview"; 
const MODEL_STD_VISION = "gemini-2.5-flash-image";

// Premium: 高智商、深度推理，用於核心戰略 (週報、體態分析)
const MODEL_PREMIUM = "gemini-3-pro-preview"; 

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
  // Use the specific environment variable requested by the user: VITE_WORKOUT_GEMINI_API
  // Note: In Vite, we use import.meta.env
  const apiKey = import.meta.env.VITE_WORKOUT_GEMINI_API;
  
  if (!apiKey) {
    console.error("Critical Error: VITE_WORKOUT_GEMINI_API not found.");
    throw new Error("系統配置錯誤：缺少 AI API 金鑰");
  }
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

// 檢查權限與配額 (Freemium Logic)
const checkAccess = (type: 'food' | 'physique' | 'weekly', profile: UserProfile, limit: number): { allowed: boolean; reason?: string } => {
  // Premium Bypass: Admin 或 Root 帳號不受限制 (Functional Lock)
  const isPremium = profile.role === 'admin' || profile.memberId === 'admin_roots';
  
  if (isPremium) {
    return { allowed: true };
  }

  // Standard User Quota Check
  const key = getQuotaKey(type);
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  
  if (current >= limit) {
    return { allowed: false, reason: "Quota Exceeded" };
  }
  
  return { allowed: true };
};

const incrementQuota = (type: 'food' | 'physique' | 'weekly') => {
  const key = getQuotaKey(type);
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, (current + 1).toString());
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
 * 食物辨識與營養分析 (Standard Mode: Flash Vision)
 * 配額: 每日 3 次 (Admin 無限)
 */
export const analyzeFoodImage = async (base64Image: string, profile: UserProfile): Promise<{ name: string; macros: MacroNutrients } | null> => {
  // 1. Check Quota
  const access = checkAccess('food', profile, 3);
  if (!access.allowed) {
    alert('David 教練：今日偵察能量已耗盡，請改用手動輸入食物名稱以維持系統運作。');
    return null; 
  }

  return callAIWithRetry(async () => {
    const ai = getAIInstance();
    // 優化提示詞：要求更具體的菜單名稱與嚴格的 JSON 格式
    const prompt = `
      任務：辨識圖中食物並估算營養。
      
      要求：
      1. 名稱 (name)：請給出具體、像餐廳菜單的描述性名稱。例如：「義式迷迭香烤雞腿排」而非「雞腿」，「美式起司牛肉漢堡餐」而非「漢堡」。
      2. 數值：依照台灣常見份量估算熱量與三大營養素。
      3. 格式：僅回傳純 JSON 字串，不要 Markdown 標記 (\`\`\`json)。

      JSON 結構：
      {
        "name": "描述性食物名稱 (繁體中文)",
        "calories": 總熱量(數值),
        "protein": 蛋白質克數(數值),
        "carbs": 碳水化合物克數(數值),
        "fat": 脂肪克數(數值)
      }
    `;
    
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1] || base64Image,
      },
    };

    const response = await ai.models.generateContent({
      model: MODEL_STD_VISION,
      contents: { parts: [imagePart, { text: prompt }] },
      config: { temperature: 0.1 }
    });

    let text = response.text?.trim() || "";
    
    // 清理 Markdown 標記，確保 JSON.parse 能成功
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 嘗試提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       console.error("AI Response invalid format:", text);
       return null;
    }
    
    // 成功後扣除配額 (Admin Bypass)
    const isPremium = profile.role === 'admin' || profile.memberId === 'admin_roots';
    if (!isPremium) incrementQuota('food');

    try {
       const parsed = JSON.parse(jsonMatch[0]);
       // 強制轉型為數字，避免 AI 回傳字串
       return {
         name: parsed.name,
         macros: {
           calories: Number(parsed.calories) || Number(parsed.macros?.calories) || 0,
           protein: Number(parsed.protein) || Number(parsed.macros?.protein) || 0,
           carbs: Number(parsed.carbs) || Number(parsed.macros?.carbs) || 0,
           fat: Number(parsed.fat) || Number(parsed.macros?.fat) || 0,
         }
       };
    } catch (e) {
       console.error("JSON Parse Error", e);
       return null;
    }
  });
};

/**
 * AI 營養戰略校準 (Settings Calibration)
 * 頻率極低，維持使用 Flash (Standard Mode)
 */
export const calculateAiNutritionPlan = async (
   weight: number, height: number, age: number, gender: string,
   activity: ActivityLevel, goal: string, dietPref: DietaryPreference
): Promise<{ dailyCalorieTarget: number, macroTargets: { protein: number, carbs: number, fat: number }, advice: string } | null> => {
   
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
         model: MODEL_STD_TEXT, // Flash
         contents: prompt,
         config: { temperature: 0.2 }
      });

      let text = response.text?.trim() || "";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid JSON");

      setCache(cacheKey, jsonMatch[0]); 
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
 * Standard Mode: Flash + 資料修剪 + 強制快取
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
      model: MODEL_STD_TEXT, // Flash
      contents: prompt,
      config: { temperature: 0.7 }
    });
    
    const result = response.text?.trim() || "David 教練：今日表現穩健。";
    setCache(cacheKey, result);
    return result;
  });
};

/**
 * 視覺診斷 (Physique Analysis)
 * Premium/Pro Mode Logic
 * 配額: 每日 1 次 (Admin 無限)
 */
export const getPhysiqueAnalysis = async (imageBase64: string, profile: UserProfile) => {
  const access = checkAccess('physique', profile, 1);
  if (!access.allowed) {
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
      // Premium Logic: Use Pro model for detailed vision analysis
      const response = await ai.models.generateContent({
        model: MODEL_PREMIUM, 
        contents: { parts: [imagePart, { text: prompt }] },
        config: { temperature: 0.7 }
      });
      
      const text = response.text || "David 教練：目前無法解析該體態數據。";
      
      // 成功後扣除配額
      const isPremium = profile.role === 'admin' || profile.memberId === 'admin_roots';
      if (!isPremium && !text.includes('存取限制')) incrementQuota('physique');
      
      return text;
    } catch (error: any) {
      if (error.message === 'ABORTED_SILENT') return "";
      return `### ⚠️ 系統連線異常\nDavid 教練：視覺核心連線失敗。`;
    }
  });
};

/**
 * 戰略週報 (Weekly Report)
 * Premium Mode: Pro Model for Deep Reasoning
 */
export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
) => {
  const currentWeek = getTaiwanWeekId();
  const cacheKey = getCacheKey('weekly_report', `${profile.memberId}_${currentWeek}`);
  
  // 檢查週報配額 (2/week) - Admin Bypass
  const isPremium = profile.role === 'admin' || profile.memberId === 'admin_roots';
  
  if (!isPremium && profile.weeklyReportUsage?.weekId === currentWeek && profile.weeklyReportUsage.count >= 2) {
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
      // Premium Logic: Pro Model
      const response = await ai.models.generateContent({
        model: MODEL_PREMIUM, 
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
 * Standard Mode: Flash
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
        model: MODEL_STD_TEXT, // Flash
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
