
import { GoogleGenAI, Type } from "@google/genai";
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
    
    [輸出格式規範 - 請嚴格遵守]
    1. 使用「繁體中文」。
    2. 禁止使用冗長的段落，必須全程使用「條列式 (Bullet Points)」。
    3. 每個重點前面加上對應的 Emoji。
    4. 結構必須包含以下模組：
    
    ### 🔍 視覺特徵觀察
    - (觀察點 1)
    - (觀察點 2)
    
    ### ⚠️ 比例弱點分析
    - (針對目標的弱點分析 1)
    - (針對目標的弱點分析 2)
    
    ### 🛠️ 動作優化清單 (必須符合器械清單)
    - (動作 1：具體執行建議)
    - (動作 2：具體執行建議)
    
    ### 💡 教練戰略叮嚀
    - (一句核心建議)

    (注意：如果照片不是人類體態，請禮貌地指出並提供基於其目標的一般性增肌/減脂建議。)
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
  
  const recentMetrics = metrics.slice(-5).map(m => 
    `- ${m.date}: 體重 ${m.weight}kg, 體脂 ${m.bodyFat}%, 肌肉 ${m.muscleMass}kg`
  ).join('\n');

  const recentLogs = logs.slice(-5).map(log => 
    `- ${log.date}: 重點[${log.focus || '未設定'}], 回饋[${log.feedback || '無'}], 動作[${log.exercises.map(e => `${e.name} ${e.weight}kg`).join(', ')}]`
  ).join('\n');

  const recentPhysique = physiqueRecords.slice(0, 2).map(rec => 
    `- ${rec.date} 診斷記錄: ${rec.analysis.substring(0, 100)}...`
  ).join('\n');

  const goalStr = profile.goal === FitnessGoal.CUSTOM 
    ? `自定義目標：${profile.customGoalText}` 
    : `核心戰略：${GoalMetadata[profile.goal].label}`;

  const equipmentStr = profile.equipment?.length 
    ? `器械倉庫：${profile.equipment.join(', ')}`
    : "無指定器材";

  const prompt = `
    你是一位 AI 主教練，請根據以下數據生成「重點式戰略週報」。
    
    [輸入數據清單]
    - 目標：${goalStr}
    - 器材：${equipmentStr}
    - 體態診斷：${recentPhysique || "無"}
    - 指標：\n${recentMetrics}
    - 日誌與回饋：\n${recentLogs}
    
    [輸出格式規範 - 強制要求]
    1. 禁止長篇大論，必須使用「短句」、「清單」與「重點整理」。
    2. 使用 Markdown 標題區分模組。
    3. 語氣：專業、冷峻、權威。
    
    ### 📊 本週戰略總結
    - (用一句話定義本週成效)
    
    ### 🧠 數據矩陣洞察
    - (體重/體脂變化趨勢分析，重點標記)
    - (訓練量與目標匹配度分析)
    
    ### 🚑 身體回饋修正 (關鍵！)
    - (針對日誌中提到的痛點或疲勞，給予具體的「不錄用動作」或「減載建議」)
    - (如果提到肩膀痛，必須明確給予替代方案)
    
    ### ⚔️ 下週行動方案 (精確動作建議)
    - (推薦動作 1：組數/次數/重量 RPE 建議)
    - (推薦動作 2：組數/次數/重量 RPE 建議)
    - (推薦動作 3：組數/次數/重量 RPE 建議)
    
    ### 🏁 核心戰略叮嚀
    - (針對 ${GoalMetadata[profile.goal]?.label || '當前目標'} 的一項關鍵優化)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  return response.text;
};
