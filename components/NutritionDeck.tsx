
import React, { useState, useMemo, useRef } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem, MacroNutrients } from '../types.ts';
import { analyzeFoodImages } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { 
  Plus, ChevronLeft, ChevronRight, X, Utensils, Search, Camera, Zap, 
  Database, Scale, Save, Trash2, Clock, History, LayoutGrid, Flame,
  Activity, ArrowDown
} from 'lucide-react';
import TacticalLoader from './TacticalLoader.tsx';

// 圖片壓縮函數
const compressAndResizeImage = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = maxWidth;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

const NutritionDeck: React.FC<{ dietLogs: DietLog[]; onUpdateDietLog: (log: DietLog) => void; profile: UserProfile; workoutLogs: WorkoutLog[]; onUpdateProfile: (p: UserProfile) => void; }> = ({ dietLogs = [], onUpdateDietLog, profile, workoutLogs = [] }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof DietLog['meals']>('breakfast');
  
  const [entryTab, setEntryTab] = useState<'SEARCH' | 'AI'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 錄入狀態 (手動與搜尋名稱共用)
  const [itemName, setItemName] = useState('');
  const [itemMacros, setItemMacros] = useState<MacroNutrients>({ calories: 500, protein: 30, carbs: 50, fat: 15 });

  const currentLog = useMemo(() => {
    return dietLogs.find(l => l.date === selectedDate) || { id: selectedDate, date: selectedDate, meals: { breakfast:[], lunch:[], dinner:[], snack:[], nightSnack:[] }, waterIntake:0 };
  }, [dietLogs, selectedDate]);

  const totals = useMemo(() => {
    const allMeals = Object.values(currentLog.meals).flat() as MealRecord[];
    return allMeals.reduce((acc, m) => ({
      calories: acc.calories + m.macros.calories,
      protein: acc.protein + m.macros.protein,
      carbs: acc.carbs + m.macros.carbs,
      fat: acc.fat + m.macros.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [currentLog]);

  const burnedCalories = useMemo(() => {
    const dayLogs = workoutLogs.filter(l => l.date === selectedDate);
    return dayLogs.reduce((acc, l) => acc + (l.totalCaloriesBurned || 0), 0);
  }, [workoutLogs, selectedDate]);

  const targetCal = profile.dailyCalorieTarget || 2000;
  const remainingCal = targetCal - totals.calories + burnedCalories;

  const handleCommitEntry = () => {
    const nameToUse = itemName.trim() || searchQuery.trim();
    if (!nameToUse) { alert("請輸入項目名稱"); return; }
    
    const newMeal: MealRecord = {
      id: `m_${Date.now()}`,
      name: nameToUse,
      timestamp: new Date().toISOString(),
      servings: 1,
      macros: itemMacros
    };
    const updatedLog: DietLog = { ...currentLog, meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] } };
    onUpdateDietLog(updatedLog);
    setShowEntryModal(false);
    resetForm();
  };

  const resetForm = () => {
    setItemName('');
    setSearchQuery('');
    setItemMacros({ calories: 500, protein: 30, carbs: 50, fat: 15 });
  };

  const handleAddFromDB = (food: FoodItem) => {
    const newMeal: MealRecord = {
      id: `db_${Date.now()}`,
      name: food.name,
      timestamp: new Date().toISOString(),
      servings: 1,
      portionLabel: food.unit,
      macros: food.macros
    };
    const updatedLog: DietLog = { ...currentLog, meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] } };
    onUpdateDietLog(updatedLog);
    setShowEntryModal(false);
    resetForm();
  };

  const handleMacroChange = (field: keyof MacroNutrients, value: string | number) => {
    let num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) num = 0;
    setItemMacros(prev => ({ ...prev, [field]: num }));
  };

  // 搜尋與推薦邏輯
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // 初始顯示熱門推薦
      return FOOD_DATABASE.filter(f => ['cvs_001', 'cvs_005', 'cvs_007', 'tw_001', 'fit_001', 'fit_004', 'fit_007', 'tw_003', 'dr_001'].includes(f.id));
    }
    return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(query)).slice(0, 8);
  }, [searchQuery]);

  const mealCategories = [
    { id: 'breakfast', label: '早餐', en: 'Breakfast', icon: <Clock size={16}/> },
    { id: 'lunch', label: '午餐', en: 'Lunch', icon: <Activity size={16}/> },
    { id: 'dinner', label: '晚餐', en: 'Dinner', icon: <Utensils size={16}/> },
    { id: 'snack', label: '點心/其他', en: 'Snack', icon: <History size={16}/> },
    { id: 'nightSnack', label: '宵夜', en: 'Late Night', icon: <Flame size={16}/> }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-40 px-4 animate-in fade-in duration-500">
      
      {/* 頂部控制與日期 */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-100 pb-6 gap-4">
        <div>
          <p className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-[0.4em] mb-1">Tactical_Nutrition_Matrix</p>
          <h2 className="text-3xl font-black text-black tracking-tighter uppercase leading-none">飲食控制中心</h2>
        </div>
        <div className="flex gap-1 bg-white p-1 border border-zinc-100 shadow-sm rounded-sm self-start md:self-auto">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-zinc-50 text-zinc-400 hover:text-black transition-all"><ChevronLeft size={18}/></button>
           <div className="px-4 py-2 flex items-center justify-center font-black text-sm font-mono text-black border-x border-zinc-50">{selectedDate}</div>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-zinc-50 text-zinc-400 hover:text-black transition-all"><ChevronRight size={18}/></button>
        </div>
      </header>

      {/* 核心熱量儀表板 */}
      <div className="bg-[#0f0f12] text-white p-6 md:p-10 relative overflow-hidden rounded-sm border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#bef264] blur-[150px] opacity-[0.03]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#bef264]">Operational_Energy_Balance</p>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">剩餘熱量額度</h3>
           </div>
           <div className="text-left md:text-right">
              <p className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-[#bef264] leading-none">
                {remainingCal}
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-3 align-bottom">KCAL_REMAINING</span>
              </p>
           </div>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-8 relative z-10 border-t border-white/5 pt-6">
           <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">預設目標</p><p className="text-lg md:text-xl font-black font-mono text-white">{targetCal}</p></div>
           <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">今日攝取</p><p className="text-lg md:text-xl font-black font-mono text-white/40">{totals.calories}</p></div>
           <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">活動消耗</p><p className="text-lg md:text-xl font-black font-mono text-[#bef264]">+{burnedCalories}</p></div>
        </div>
        <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
           <div className={`h-full ${remainingCal < 0 ? 'bg-red-500' : 'bg-[#bef264]'} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${Math.min(100, (totals.calories / (targetCal + burnedCalories)) * 100)}%` }}></div>
        </div>
      </div>

      {/* 宏量營養分析 */}
      <div className="bg-white border border-zinc-100 p-6 md:p-8 shadow-sm rounded-sm">
        <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-50 pb-4 text-zinc-400">
           <LayoutGrid size={16} /> 宏量營養分析
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
           {[
             { l: '蛋白質', v: totals.protein, t: profile.macroTargets?.protein || 150, b: 'bg-black' },
             { l: '碳水化合物', v: totals.carbs, t: profile.macroTargets?.carbs || 200, b: 'bg-blue-500' },
             { l: '脂肪', v: totals.fat, t: profile.macroTargets?.fat || 70, b: 'bg-orange-400' }
           ].map((macro, i) => (
              <div key={i} className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{macro.l}</span>
                    <span className="font-mono font-black text-base">{Math.round(macro.v)}<span className="text-[9px] text-zinc-300 ml-1">/ {macro.t}g</span></span>
                 </div>
                 <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className={`h-full ${macro.b} transition-all duration-1000 shadow-[0_0_5px_currentColor]`} style={{ width: `${Math.min(100, (macro.v/macro.t)*100)}%` }}></div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* 飲食分類卡片 */}
      <div className="space-y-4">
        {mealCategories.map(cat => {
           const meals = (currentLog.meals[cat.id as keyof DietLog['meals']] || []) as MealRecord[];
           const categoryTotal = meals.reduce((s, m) => s + m.macros.calories, 0);
           return (
              <div key={cat.id} className="bg-white border border-zinc-100 overflow-hidden group hover:border-black transition-all rounded-sm shadow-sm">
                 <div className="p-4 md:p-5 flex items-center justify-between border-b border-zinc-50 bg-zinc-50/20">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white border border-zinc-100 text-zinc-300 flex items-center justify-center group-hover:bg-black group-hover:text-[#bef264] transition-all rounded-sm">{cat.icon}</div>
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-black">{cat.label}</h4>
                          <p className="text-[10px] font-mono font-bold text-zinc-400">{categoryTotal} KCAL</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => { setActiveMealType(cat.id as any); setShowEntryModal(true); setEntryTab('SEARCH'); }} 
                       className="p-2 md:px-4 md:py-2 bg-white border border-zinc-200 text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#bef264] hover:border-black transition-all rounded-sm shadow-sm active:scale-95"
                    >
                       <Plus size={16} />
                    </button>
                 </div>
                 <div className="divide-y divide-zinc-50">
                    {meals.length > 0 ? (
                       meals.map((m: MealRecord) => (
                          <div key={m.id} className="p-4 pl-14 md:pl-16 flex justify-between items-center hover:bg-zinc-50/50 group/item">
                             <div className="overflow-hidden">
                                <p className="text-sm font-bold text-black truncate">{m.name}</p>
                                <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">P:{m.macros.protein} C:{m.macros.carbs} F:{m.macros.fat}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="text-sm font-black font-mono">{m.macros.calories}K</span>
                                <button 
                                   onClick={() => {
                                      const updatedLog = { ...currentLog, meals: { ...currentLog.meals, [cat.id]: meals.filter(x => x.id !== m.id) } };
                                      onUpdateDietLog(updatedLog);
                                   }}
                                   className="text-zinc-200 hover:text-red-500 transition-colors opacity-100 md:opacity-0 group-hover/item:opacity-100"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                          </div>
                       ))
                    ) : (
                       <div className="p-8 text-center text-[10px] font-black text-zinc-200 uppercase tracking-[0.2em] italic">暫無紀錄 NO_DATA</div>
                    )}
                 </div>
              </div>
           );
        })}
      </div>

      {/* 核心登錄視窗 (搜尋與手動合一) */}
      {showEntryModal && (
         <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white border border-zinc-100 shadow-[0_40px_120px_rgba(0,0,0,0.15)] flex flex-col h-[90vh] overflow-hidden rounded-sm">
               
               {/* 視窗頂部 */}
               <div className="flex justify-between items-center p-6 md:p-8 bg-[#0f0f12] text-white">
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Session_Input_Stream</p>
                     <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">登錄項目: <span className="text-[#bef264]">{activeMealType}</span></h3>
                  </div>
                  <button onClick={() => setShowEntryModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-[#bef264] hover:text-black transition-all rounded-full"><X size={24}/></button>
               </div>

               {/* 分頁選擇 */}
               <div className="flex bg-zinc-50 border-b border-zinc-100">
                  <button onClick={() => setEntryTab('SEARCH')} className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all ${entryTab === 'SEARCH' ? 'bg-white text-black shadow-inner border-b-2 border-black' : 'text-zinc-400'}`}>資料庫搜尋 & 手動錄入</button>
                  <button onClick={() => setEntryTab('AI')} className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all ${entryTab === 'AI' ? 'bg-white text-black shadow-inner border-b-2 border-black' : 'text-zinc-400'}`}>AI 影像診斷辨識</button>
               </div>

               {/* 內容區域 */}
               <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fafafa]">
                  {entryTab === 'SEARCH' && (
                     <div className="p-6 md:p-10 space-y-10 animate-in fade-in">
                        
                        {/* 1. 搜尋區域 (加大字體) */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              <Search size={14} /> 資料庫即時檢索 DATABASE_QUERY
                           </div>
                           <div className="relative">
                              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={28}/>
                              <input 
                                 autoFocus value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setItemName(e.target.value); }}
                                 placeholder="搜尋或輸入補給名稱..." 
                                 className="w-full bg-white border border-zinc-200 p-6 pl-16 text-3xl font-black outline-none focus:border-black transition-all rounded-sm shadow-sm placeholder:text-zinc-200" 
                              />
                           </div>

                           <div className="space-y-2">
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-4 mb-2">
                                {searchQuery ? '匹配結果 MATCHED_RESULTS' : '熱門補給建議 POPULAR_SUGGESTIONS'}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                 {searchResults.map(f => (
                                    <button key={f.id} onClick={() => handleAddFromDB(f)} className="w-full text-left p-6 bg-white border border-zinc-100 hover:border-black transition-all flex justify-between items-center group rounded-sm shadow-sm active:scale-95">
                                       <div>
                                          <p className="font-black text-xl text-black">{f.name}</p>
                                          <p className="text-[10px] font-mono text-zinc-400 uppercase">{f.unit}</p>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <span className="font-mono font-black text-2xl">{f.macros.calories}K</span>
                                          <Plus size={20} className="text-zinc-200 group-hover:text-black"/>
                                       </div>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* 分隔線 */}
                        <div className="relative py-4">
                           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 border-dashed"></div></div>
                           <div className="relative flex justify-center"><span className="bg-[#fafafa] px-6 text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">OR_MANUAL_CALIBRATION</span></div>
                        </div>

                        {/* 2. 手動新增區域 (常駐顯示) */}
                        <div className="bg-white border border-zinc-200 p-8 md:p-12 rounded-sm space-y-10 shadow-sm">
                           <div className="flex justify-between items-center border-b border-zinc-50 pb-6">
                              <div className="flex items-center gap-3">
                                 <Plus className="text-black" size={20} />
                                 <h4 className="text-sm font-black uppercase text-black tracking-widest">手動精確錄入 MANUAL_ENTRY</h4>
                              </div>
                              <div className="text-[10px] font-black text-zinc-300 uppercase">Input_ID: {itemName || 'UNDEFINED'}</div>
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">補給名稱校準 ITEM_NAME_SYNC</label>
                              <input 
                                 value={itemName} onChange={e => setItemName(e.target.value)}
                                 placeholder="輸入完整補給名稱..." 
                                 className="w-full bg-zinc-50 border border-zinc-100 p-5 text-2xl font-black outline-none focus:bg-white focus:border-black transition-all rounded-sm"
                              />
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                              {[
                                { f: 'calories', l: '熱量', unit: 'KCAL', max: 2000, step: 5, acc: 'accent-black' },
                                { f: 'protein', l: '蛋白質', unit: 'G', max: 150, step: 1, acc: 'accent-orange-500' },
                                { f: 'carbs', l: '碳水', unit: 'G', max: 300, step: 1, acc: 'accent-blue-500' },
                                { f: 'fat', l: '脂肪', unit: 'G', max: 100, step: 1, acc: 'accent-yellow-500' }
                              ].map((macro) => (
                                 <div key={macro.f} className="space-y-4">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{macro.l}</label>
                                       <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2 border border-zinc-100 rounded-sm">
                                          <input 
                                             type="number" value={itemMacros[macro.f as keyof MacroNutrients]} 
                                             onChange={e => handleMacroChange(macro.f as any, e.target.value)}
                                             className="w-16 bg-transparent text-right font-mono font-black text-xl outline-none"
                                          />
                                          <span className="text-[10px] font-black text-zinc-300">{macro.unit}</span>
                                       </div>
                                    </div>
                                    <input 
                                       type="range" min="0" max={macro.max} step={macro.step} 
                                       value={itemMacros[macro.f as keyof MacroNutrients]} 
                                       onChange={e => handleMacroChange(macro.f as any, e.target.value)} 
                                       className={`w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer ${macro.acc}`} 
                                    />
                                 </div>
                              ))}
                           </div>

                           <button onClick={handleCommitEntry} className="w-full bg-black text-[#bef264] py-7 font-black uppercase tracking-[0.5em] text-xs hover:bg-[#bef264] hover:text-black transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4 rounded-sm active:scale-95">
                              <Save size={24} /> 封存並同步數據 COMMIT_DATA_SYNC
                           </button>
                        </div>
                     </div>
                  )}

                  {entryTab === 'AI' && (
                     <div className="h-full flex flex-col p-10">
                        {isAnalyzing ? (
                           <TacticalLoader type="DIET" title="正在啟動 AI 影像診斷中樞" />
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center py-20 space-y-12">
                              <div onClick={() => fileInputRef.current?.click()} className="w-80 h-80 border-2 border-dashed border-zinc-200 hover:border-black hover:bg-white transition-all flex flex-col items-center justify-center gap-6 cursor-pointer group rounded-sm shadow-inner">
                                 <div className="w-20 h-20 bg-black text-[#bef264] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"><Camera size={40} /></div>
                                 <div className="text-center">
                                    <p className="text-lg font-black text-black uppercase tracking-tight mb-1">上傳補給影像</p>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">AI 多光譜視覺分析</p>
                                 </div>
                              </div>
                              <input type="file" ref={fileInputRef} onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (!file) return;
                                 setIsAnalyzing(true);
                                 try {
                                    const base64 = await compressAndResizeImage(file);
                                    const results = await analyzeFoodImages([base64], profile);
                                    if (results.length > 0) {
                                       setItemName(results[0].name);
                                       setItemMacros(results[0].macros);
                                       setEntryTab('SEARCH');
                                    }
                                 } catch (err) { alert("辨識失敗"); } finally { setIsAnalyzing(false); }
                              }} className="hidden" accept="image/*" />
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default NutritionDeck;
