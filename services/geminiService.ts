
import { GoogleGenAI } from "@google/genai";
import { UserProfile, UserMetrics, GoalMetadata, WorkoutLog, FitnessGoal, PhysiqueRecord } from "../types";

export const getPhysiqueAnalysis = async (imageBase64: string, profile: UserProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const goalStr = profile.goal === FitnessGoal.CUSTOM 
    ? `自定義目標：${profile.customGoalText}` 
    : `${GoalMetadata[profile.goal].label} (${GoalMetadata[profile.goal].focus})`;

  const equipmentStr = profile.equipment?.length 
    ? `可用器材清單：${profile.equipment.join(', ')}`
    : "未指定器械，請提供一般性建議。";

  const prompt = `
    你是一位極度專業且冷靜的健身教練，正在進行「視覺診斷」。
    
    [用戶基本資料]
    - 目標：${goalStr}
    - 身高：${profile.height}cm，年齡：${profile.age}歲
    - ${equipmentStr}
    
    [輸出格式規範]
    1. 使用「繁體中文」。全程使用「條列式」。
    2. 結構：🔍 視覺特徵觀察、⚠️ 比例弱點分析、🛠️ 動作優化清單、💡 教練戰略叮嚀。
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64.split(',')[1] || imageBase64,
    },
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: prompt }] },
  });

  return response.text;
};

export const generateWeeklyReport = async (
  profile: UserProfile, 
  metrics: UserMetrics[], 
  logs: WorkoutLog[], 
  physiqueRecords: PhysiqueRecord[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const recentMetrics = metrics.slice(-7).map(m => 
    `- ${m.date}: 體重 ${m.weight}kg, 體脂 ${m.bodyFat}%, 肌肉 ${m.muscleMass}kg`
  ).join('\n');

  const recentLogs = logs.slice(-7).map(log => 
    `- ${log.date}: 時長 ${log.durationMinutes}min, 焦點[${log.focus || '全方位'}], 訓練況狀/回饋[${log.feedback || '正常'}], 動作內容[${log.exercises.map(e => `${e.name} ${e.weight}kg`).join(', ')}]`
  ).join('\n');

  const recentPhysique = physiqueRecords.slice(0, 3).map(rec => 
    `- ${rec.date} 視覺診斷分析摘要: ${rec.analysis.substring(0, 200)}`
  ).join('\n');

  const prompt = `
    你是一位領先全球的健身戰略主導官 (AI Chief Strategist)。請根據以下三維矩陣數據生成「終極戰略週報」。
    
    [生理矩陣數據]
    - 目標：${profile.goal}
    - 體標變化趨勢：\n${recentMetrics}
    - 訓練日誌與執行者回饋 (包含疲勞感與況狀)：\n${recentLogs}
    - 視覺診斷歷史紀錄：\n${recentPhysique || "無紀錄"}
    
    [輸出格式與內容要求]
    1. 使用繁體中文。專業、冷峻、權威感。
    2. 禁止冗贅，僅輸出核心價值。
    3. 必須包含以下標題模組：
    
    ### 🛡️ 戰略現況評估 (Strategic Assessment)
    - 綜合生理數據、訓練日誌與視覺變化給予當前成效定性。
    
    ### ⚖️ 動作與強度優化 (Tactical Refinement)
    - 針對日誌回饋中提到的況狀（如痠痛、精神不佳、力量增加等）給予具體動作調整。
    
    ### 🥑 能量代謝建議 (Nutritional Logistics)
    - 根據體標變化（體脂/肌肉）建議下週熱量攝取或營養素分配方向。
    
    ### ⚠️ 醫療與執行警語 (MANDATORY DISCLAIMER)
    - 必須包含：若有任何身體不適請立即停止並諮詢醫師或物理治療師；重訓執行需依身體當前狀況量力而為。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return response.text;
};
