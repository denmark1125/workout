
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, FitnessGoal, PhysiqueRecord } from "../types";

// 初始化 AI 引擎
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * 測試 AI 連線狀態 (System Diagnostics)
 * 用於確認 API Key 是否有效且能正常存取 Gemini 模型
 */
export const testConnection = async (): Promise<boolean> => {
  const ai = getAIInstance();
  try {
    // 使用輕量級模型進行快速 Ping 測試
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
 * 視覺診斷：由 David 教練進行體態影像分析
 */
export const getPhysiqueAnalysis = async (imageBase64: string, profile: UserProfile) => {
  const ai = getAIInstance();
  const meta = GoalMetadata[profile.goal];
  const goalStr = profile.goal === FitnessGoal.CUSTOM 
    ? `自定義目標：${profile.customGoalText}` 
    : `${meta.label} (戰略重點：${meta.focus})`;

  const equipmentStr = profile.equipment?.length 
    ? `目前可用裝備：${profile.equipment.join(', ')}`
    : "無特定器械。";

  const systemInstruction = `
    你現在是「David 教練」，The Matrix 系統的首席戰略官。
    你的任務是為使用者提供冷靜、科學且具備「戰場直覺」的視覺診斷。
    
    [行為準則]
    1. 語氣：冷靜但具備壓迫感的專業，結合台灣健身圈術語（如：增肌、減脂、超負荷、代償、受力感）。
    2. 稱呼：絕對禁止使用「執行者」，必須使用使用者的暱稱「${profile.name}」。
    3. 語言：必須使用「繁體中文 (台灣)」。
    4. 格式：全程使用 Markdown 條列式，標題需使用 Emoji。
  `;

  const prompt = `
    [執行者狀態]
    - 暱稱：${profile.name}
    - 性別：${profile.gender === 'F' ? '女性' : '男性'}
    - 核心目標：${goalStr}
    - 身高：${profile.height}cm
    - ${equipmentStr}
    
    [分析要求]
    請針對影像進行以下維度的分析：
    🔍 視覺特徵觀測 (視覺上的肌肉分佈、體脂感)
    ⚠️ 弱點分析 (比例失衡或需加強部位)
    🛠️ 戰術調整建議 (具體的動作訓練建議)
    💡 首席戰略官叮嚀 (給 ${profile.name} 的一句話)
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64.split(',')[1] || imageBase64,
    },
  };

  try {
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
    console.error("David Coach Analysis Error:", error);
    throw new Error("系統連結中斷，無法完成視覺診斷。");
  }
};

/**
 * 戰略週報：深度分析生理矩陣並引用最新運動科學
 */
export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
) => {
  const ai = getAIInstance();
  const meta = GoalMetadata[profile.goal];
  
  const recentMetrics = metrics.slice(-7).map(m => 
    `- ${m.date}: 體重 ${m.weight}kg, 體脂 ${m.bodyFat}%, 肌肉 ${m.muscleMass}kg`
  ).join('\n');

  const recentLogs = logs.slice(-7).map(log => 
    `- ${log.date}: 訓練焦點[${log.focus || '全方位'}], 回饋[${log.feedback || '正常'}]`
  ).join('\n');

  const systemInstruction = `
    你現在是「David 教練」，負責生成最高級別的「健身戰略週報」。
    你需要整合生理數據、訓練日誌，並運用搜尋功能參考最新的運動營養與訓練科學。
    
    [重要規範]
    1. 稱呼：必須使用「${profile.name}」，嚴禁使用「執行者」。
    2. 語氣：專業、在地化（台灣健身術語）。
  `;

  const prompt = `
    用戶暱稱：${profile.name}
    成員 ID：${profile.memberId}
    當前戰略目標：${meta.label}
    
    [近期健身紀錄]
    ${recentMetrics}
    
    [近一週訓練軌跡]
    ${recentLogs}
    
    請根據以上數據，為 ${profile.name} 生成一份深度週報。請務必包含：
    ### 🛡️ 戰術評估 (分析趨勢是否符合目標)
    ### ⚖️ 動作優化 (針對訓練動作與頻率的建議)
    ### 🥑 能量代謝建議 (基於目標的飲食建議)
    ### ⚠️ 首席戰略官警語 (給 ${profile.name} 的最終提醒)
    
    *若有搜尋到相關運動科學文獻或最新趨勢，請一併引用。*
  `;

  try {
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
    console.error("David Coach Report Error:", error);
    throw new Error("戰略週報生成失敗，核心引擎同步異常。");
  }
};
