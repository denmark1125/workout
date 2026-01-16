
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, FitnessGoal, PhysiqueRecord } from "../types";

// 輔助函數：安全獲取 AI 實例
const getAIInstance = () => {
  // Vite 標準寫法：直接讀取 VITE_ 開頭的變數
  const apiKey = import.meta.env.VITE_WORKOUT_GEMINI_API;
  
  if (!apiKey) {
    console.error("API Key Missing: 找不到 VITE_WORKOUT_GEMINI_API");
    throw new Error("請確認 Vercel 後台環境變數名稱是否為 VITE_WORKOUT_GEMINI_API 並重新部署。");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 測試 AI 連線狀態
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const ai = getAIInstance();
    await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: "System Check: Ping",
    });
    return true;
  } catch (error) {
    console.error("AI Core Uplink Failed:", error);
    return false;
  }
};

/**
 * David 教練：首頁常駐問候與督促 (完全本地化版本)
 * 不再連接 AI，改為本地邏輯判斷時間與季節，確保瞬間回應且穩定。
 */
export const getDavidGreeting = async (profile: UserProfile): Promise<string> => {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1; // 1-12
  
  // 優先使用 Member ID (巨巨代號)，除非用戶有設定非預設的暱稱
  const nameToUse = (profile.name && profile.name !== 'User') 
    ? profile.name 
    : (profile.memberId || '巨巨');

  let quotes: string[] = [];

  // 時段邏輯 (Time Context)
  if (hour >= 5 && hour < 11) {
    // 清晨
    quotes = [
      `早安，${nameToUse}。系統已啟動。清晨的寧靜適合專注，別浪費了這段時光。`,
      `一日之計在於晨。${nameToUse}，喚醒你的神經連結，準備執行今日任務。`,
      `早安。大腦或許還想待機，但你的身體已經準備好進化了。`,
      `清晨空氣稀薄而純淨。${nameToUse}，這是屬於強者的時段。`,
      `早安，${nameToUse}。不管天氣如何，先把第一組熱身做完再說。`
    ];
  } else if (hour >= 11 && hour < 14) {
    // 正午
    quotes = [
      `午安，${nameToUse}。忙碌之餘別忘了補充燃料，這是你的能量來源。`,
      `正午時分。短暫的抽離與訓練，能讓你的下午運算更有效率。`,
      `別因為忙碌而妥協飲食。${nameToUse}，紀律體現在每一個選擇裡。`,
      `系統提示：該喝水了。保持代謝運轉是戰略基礎。`,
      `休息是為了走更長的路，${nameToUse}。調整呼吸，準備下半場。`
    ];
  } else if (hour >= 14 && hour < 18) {
    // 下午
    quotes = [
      `下午好，${nameToUse}。生理機能此刻正處高峰，去挑戰你的極限重量。`,
      `別被午後的倦意擊倒。${nameToUse}，意志力是你最強的興奮劑。`,
      `距離下班還有點時間，但你的肌肉渴望著張力。保持專注。`,
      `還記得你的目標嗎？${nameToUse}，現在就是縮短距離的最佳時刻。`,
      `下午好，${nameToUse}。專注在那些你能控制的事情上：呼吸、動作、節奏。`
    ];
  } else if (hour >= 18 && hour < 23) {
    // 晚間
    quotes = [
      `晚上好，${nameToUse}。卸下一天的防備，這裡只有你和重量。`,
      `把白天的壓力轉化為推力。${nameToUse}，這是屬於你的修復程式。`,
      `城市喧囂，但這裡只有鐵塊的聲音。享受這份純粹。`,
      `別把疲憊帶回家。用汗水洗淨思緒，今晚你會睡得更好，${nameToUse}。`,
      `晚上好。今天過得如何？無論如何，訓練會讓一切變好。`
    ];
  } else {
    // 深夜
    quotes = [
      `夜深了，${nameToUse}。這份堅持很孤獨，但這也是你與眾不同的原因。`,
      `萬籟俱寂。${nameToUse}，注意組間休息，深夜訓練更考驗專注力。`,
      `還在執行任務？${nameToUse}，你的意志力令人敬佩，但睡眠也是訓練的一環。`,
      `系統提示：深夜時段，請專注感受肌肉收縮，安全優先。`,
      `辛苦了，${nameToUse}。練完早點休息，修復是變強的關鍵。`
    ];
  }

  // 季節微調 (Seasonal Context)
  if (month >= 12 || month <= 2) { // 冬季
     if (Math.random() > 0.7) quotes.push(`氣溫較低，${nameToUse}，請務必延長熱身時間，保護關節運作。`);
  } else if (month >= 6 && month <= 8) { // 夏季
     if (Math.random() > 0.7) quotes.push(`天氣炎熱，${nameToUse}，注意水分流失，保持電解質平衡。`);
  }

  // 隨機選取一句
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  return `David 教練：${randomQuote}`;
};

/**
 * 視覺診斷 (使用 AI)
 */
export const getPhysiqueAnalysis = async (imageBase64: string, profile: UserProfile) => {
  const meta = GoalMetadata[profile.goal];
  const goalStr = profile.goal === FitnessGoal.CUSTOM 
    ? `自定義目標：${profile.customGoalText}` 
    : `${meta.label} (戰略重點：${meta.focus})`;

  const equipmentStr = profile.equipment?.length 
    ? `目前可用裝備：${profile.equipment.join(', ')}`
    : "無特定器械。";

  const systemInstruction = `
    你現在是「David 教練」，The Matrix 系統的首席戰略官。
    任務：體態視覺診斷。
    語氣：冷靜、專業、戰場直覺、台灣健身術語。
    稱呼：${profile.name}。
    格式：Markdown 條列式。
  `;

  const prompt = `
    使用者：${profile.name} (${profile.gender === 'F' ? '女性' : '男性'})
    目標：${goalStr}
    裝備：${equipmentStr}
    
    請分析影像中的：視覺特徵、弱點分析、戰術建議、戰略官叮嚀。
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
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    return `### ⚠️ 系統連線異常\n\nDavid 教練：無法連接至視覺核心。請檢查 VITE_WORKOUT_GEMINI_API 設定。`;
  }
};

/**
 * 戰略週報 (使用 AI)
 */
export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
) => {
  const meta = GoalMetadata[profile.goal];
  const recentMetrics = metrics.slice(-7).map(m => `- ${m.date}: ${m.weight}kg, 體脂${m.bodyFat}%`).join('\n');
  const recentLogs = logs.slice(-7).map(l => `- ${l.date}: ${l.focus}`).join('\n');

  const systemInstruction = `
    你現在是「David 教練」。
    任務：生成健身戰略週報。
    語氣：專業數據分析、引用科學、台灣用語。
    稱呼：${profile.name}。
  `;

  const prompt = `
    目標：${meta.label}
    近期紀錄：\n${recentMetrics}
    近期訓練：\n${recentLogs}
    
    請生成週報，包含：戰術評估、動作優化、飲食建議、戰略官警語。
  `;

  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    let outputText = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (sources && sources.length > 0) {
      outputText += "\n\n---\n**戰略參考來源：**\n";
      sources.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          outputText += `- [${chunk.web.title || '外部數據節點'}](${chunk.web.uri})\n`;
        }
      });
    }
    return outputText;
  } catch (error) {
    return `### ⚠️ 週報生成失敗\n\nDavid 教練：系統離線。請檢查 VITE_WORKOUT_GEMINI_API 設定。`;
  }
};

/**
 * 每日獎勵簡報 (Modal 用)
 */
export const getDailyBriefing = async (
  profile: UserProfile,
  streak: number
): Promise<string> => {
  const meta = GoalMetadata[profile.goal];
  
  const systemInstruction = `
    你現在是「David 教練」。
    任務：每日登入獎勵的恭喜語句。
    語氣：肯定、榮耀、簡潔。
    稱呼：${profile.name}。
  `;

  const prompt = `
    連續登入第 ${streak} 天。目標：${meta.label}。
    給一句肯定並鼓勵他領取獎勵的話。
  `;

  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.9 }
    });
    return response.text.trim();
  } catch (error) {
    return `"${profile.name}，你的堅持是系統最強大的演算法。領取你的獎勵。"`;
  }
};
