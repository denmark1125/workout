
import React, { useState, useMemo, useRef } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem, MacroNutrients } from '../types.ts';
import { analyzeFoodImages } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { 
  Plus, ChevronLeft, ChevronRight, X, Utensils, Search, Camera, Zap, 
  Database, Scale, Save, Trash2, Clock, History, LayoutGrid, Flame,
  Activity
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
  
  const [entryTab, setEntryTab] = useState<'QUICK' | 'SEARCH' | 'AI'>('QUICK');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 快速輸入狀態
  const [quickMealName, setQuickMealName] = useState('');
  const [quickMacros, setQuickMacros] = useState<MacroNutrients>({ calories: 500, protein: 30, carbs: 50, fat: 15 });

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

  const handleQuickAddMacros = () => {
    if (!quickMealName.trim()) { alert("請輸入補給名稱"); return; }
    const newMeal: MealRecord = {
      id: `q_${Date.now()}`,
      name: quickMealName.trim(),
      timestamp: new Date().toISOString(),
      servings: 1,
      macros: quickMacros
    };
    const updatedLog: DietLog = { ...currentLog, meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] } };
    onUpdateDietLog(updatedLog);
    setShowEntryModal(false);
    setQuickMealName('');
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
  };

  const handleQuickMacroChange = (field: keyof MacroNutrients, value: string | number) => {
    let num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) num = 0;
    setQuickMacros(prev => ({ ...prev, [field]: num }));
  };

  const mealCategories = [
    { id: 'breakfast', label: '早餐', en: 'Breakfast', icon: <Clock size={16}/> },
    { id: 'lunch', label: '午餐', en: 'Lunch', icon: <Activity size={16}/> },
    { id: 'dinner', label: '晚餐', en: 'Dinner', icon: <Utensils size={16}/> },
    { id: 'snack', label: '點心/其他', en: 'Snack', icon: <History size={16}/> },
    { id: 'nightSnack', label: '宵夜', en: 'Late Night', icon: <Flame size={16}/> }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-40 px-4 animate-in fade-in duration-500">
      
      {/* 頂部標題與日期控制 */}
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

      {/* 核心熱量儀表板 - 修正溢出與響應式 */}
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
           <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">預設目標 <span className="text-[8px] opacity-30">Goal</span></p>
              <p className="text-lg md:text-xl font-black font-mono text-white">{targetCal}</p>
           </div>
           <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">今日攝取 <span className="text-[8px] opacity-30">Intake</span></p>
              <p className="text-lg md:text-xl font-black font-mono text-white/40">{totals.calories}</p>
           </div>
           <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">活動消耗 <span className="text-[8px] opacity-30">Burn</span></p>
              <p className="text-lg md:text-xl font-black font-mono text-[#bef264]">+{burnedCalories}</p>
           </div>
        </div>

        <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
           <div className={`h-full ${remainingCal < 0 ? 'bg-red-500' : 'bg-[#bef264]'} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${Math.min(100, (totals.calories / (targetCal + burnedCalories)) * 100)}%` }}></div>
        </div>
      </div>

      {/* 宏量營養分析報告 - 移至熱量儀表板下方 */}
      <div className="bg-white border border-zinc-100 p-6 md:p-8 shadow-sm rounded-sm">
        <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-50 pb-4 text-zinc-400">
           <LayoutGrid size={16} /> 宏量營養分析 <span className="text-[9px] opacity-50 ml-1">MACRO_REPORTS</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
           {[
             { l: '蛋白質', en: 'Protein', v: totals.protein, t: profile.macroTargets?.protein || 150, b: 'bg-black' },
             { l: '碳水化合物', en: 'Carbs', v: totals.carbs, t: profile.macroTargets?.carbs || 200, b: 'bg-blue-500' },
             { l: '脂肪', en: 'Fat', v: totals.fat, t: profile.macroTargets?.fat || 70, b: 'bg-orange-400' }
           ].map((macro, i) => (
              <div key={i} className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{macro.l} <span className="text-[8px] opacity-40 ml-1">{macro.en}</span></span>
                    <span className="font-mono font-black text-base">{Math.round(macro.v)}<span className="text-[9px] text-zinc-300 ml-1">/ {macro.t}g</span></span>
                 </div>
                 <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden">
                    <div className={`h-full ${macro.b} transition-all duration-1000 shadow-[0_0_5px_currentColor]`} style={{ width: `${Math.min(100, (macro.v/macro.t)*100)}%` }}></div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* 飲食分類卡片清單 (紀錄整合於此) */}
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
                          <h4 className="text-sm font-black uppercase tracking-widest text-black">{cat.label} <span className="text-[9px] text-zinc-300 font-bold ml-1">{cat.en}</span></h4>
                          <p className="text-[10px] font-mono font-bold text-zinc-400">{categoryTotal} KCAL</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => { setActiveMealType(cat.id as any); setShowEntryModal(true); setEntryTab('QUICK'); }} 
                       className="p-2 md:px-4 md:py-2 bg-white border border-zinc-200 text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#bef264] hover:border-black transition-all rounded-sm shadow-sm active:scale-95"
                    >
                       <span className="hidden md:inline">新增紀錄</span>
                       <Plus size={16} className="md:hidden" />
                    </button>
                 </div>
                 
                 {/* 分類內的飲食紀錄清單 */}
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
                       <div className="p-8 text-center text-[10px] font-black text-zinc-200 uppercase tracking-[0.2em] italic">暫無補給數據 NO_DATA_DETECTED</div>
                    )}
                 </div>
              </div>
           );
        })}
      </div>

      {/* 核心登錄視窗 (Sleek Terminal Modal) */}
      {showEntryModal && (
         <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-white border border-zinc-100 shadow-[0_40px_120px_rgba(0,0,0,0.15)] flex flex-col h-[85vh] overflow-hidden rounded-sm">
               
               {/* 視窗頂部 */}
               <div className="flex justify-between items-center p-6 md:p-8 bg-[#0f0f12] text-white">
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Session_Input_Stream</p>
                     <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">登錄項目: <span className="text-[#bef264]">{activeMealType}</span></h3>
                  </div>
                  <button onClick={() => setShowEntryModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-[#bef264] hover:text-black transition-all rounded-full"><X size={24}/></button>
               </div>

               {/* 分頁選擇 */}
               <div className="flex bg-zinc-50 border-b border-zinc-100">
                  <button onClick={() => setEntryTab('QUICK')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${entryTab === 'QUICK' ? 'bg-white text-black shadow-inner' : 'text-zinc-400'}`}>快速錄入</button>
                  <button onClick={() => setEntryTab('SEARCH')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-x border-zinc-100 ${entryTab === 'SEARCH' ? 'bg-white text-black shadow-inner' : 'text-zinc-400'}`}>資料庫搜尋</button>
                  <button onClick={() => setEntryTab('AI')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${entryTab === 'AI' ? 'bg-white text-black shadow-inner' : 'text-zinc-400'}`}>AI 辨識</button>
               </div>

               {/* 內容區域 */}
               <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#fafafa]">
                  {entryTab === 'QUICK' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">補給名稱 <span className="text-[8px] opacity-50">ITEM_NAME</span></label>
                           <input 
                              autoFocus
                              value={quickMealName}
                              onChange={e => setQuickMealName(e.target.value)}
                              placeholder="例如：雞胸肉沙拉、高蛋白飲..."
                              className="w-full bg-white border border-zinc-200 p-4 text-xl font-black outline-none focus:border-black transition-all rounded-sm shadow-sm"
                           />
                        </div>

                        <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-sm space-y-8 shadow-sm">
                           <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-50 pb-4">數值精確校準 MACRO_SYNC</h4>
                           
                           <div className="space-y-8">
                              {[
                                { f: 'calories', l: '熱量', en: 'Energy', unit: 'KCAL', max: 2000, step: 5, acc: 'accent-black' },
                                { f: 'protein', l: '蛋白質', en: 'Protein', unit: 'G', max: 150, step: 1, acc: 'accent-orange-500' },
                                { f: 'carbs', l: '碳水', en: 'Carbs', unit: 'G', max: 300, step: 1, acc: 'accent-blue-500' },
                                { f: 'fat', l: '脂肪', en: 'Fat', unit: 'G', max: 100, step: 1, acc: 'accent-yellow-500' }
                              ].map((macro) => (
                                 <div key={macro.f} className="space-y-3">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{macro.l} <span className="text-[8px] opacity-30 ml-1">{macro.en}</span></label>
                                       <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 border border-zinc-100 rounded-sm">
                                          <input 
                                             type="number" 
                                             value={quickMacros[macro.f as keyof MacroNutrients]} 
                                             onChange={e => handleQuickMacroChange(macro.f as any, e.target.value)}
                                             className="w-14 bg-transparent text-right font-mono font-black text-lg outline-none"
                                          />
                                          <span className="text-[10px] font-black text-zinc-300">{macro.unit}</span>
                                       </div>
                                    </div>
                                    <input 
                                       type="range" min="0" max={macro.max} step={macro.step} 
                                       value={quickMacros[macro.f as keyof MacroNutrients]} 
                                       onChange={e => handleQuickMacroChange(macro.f as any, e.target.value)} 
                                       className={`w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer ${macro.acc}`} 
                                    />
                                 </div>
                              ))}
                           </div>

                           <button onClick={handleQuickAddMacros} className="w-full bg-black text-[#bef264] py-5 font-black uppercase tracking-[0.4em] text-xs hover:bg-[#bef264] hover:text-black transition-all shadow-xl flex items-center justify-center gap-3 rounded-sm active:scale-95">
                              <Save size={18} /> 封存數據 COMMIT_DATA
                           </button>
                        </div>
                     </div>
                  )}

                  {entryTab === 'SEARCH' && (
                     <div className="space-y-8 animate-in fade-in">
                        <div className="relative">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={20}/>
                           <input 
                              autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                              placeholder="搜尋預設補給庫..." 
                              className="w-full bg-white border border-zinc-200 p-4 pl-16 text-lg font-black outline-none focus:border-black transition-all rounded-sm shadow-sm" 
                           />
                        </div>
                        {searchQuery && (
                           <div className="space-y-1">
                              {FOOD_DATABASE.filter(f => f.name.includes(searchQuery)).slice(0, 8).map(f => (
                                 <button key={f.id} onClick={() => handleAddFromDB(f)} className="w-full text-left p-5 bg-white border border-zinc-50 hover:border-black transition-all flex justify-between items-center group rounded-sm shadow-sm">
                                    <div><p className="font-black text-base">{f.name}</p><p className="text-[9px] font-mono text-zinc-400 uppercase">{f.unit}</p></div>
                                    <div className="flex items-center gap-6"><span className="font-mono font-black text-lg">{f.macros.calories}K</span><Plus size={16} className="text-zinc-200 group-hover:text-black"/></div>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

                  {entryTab === 'AI' && (
                     <div className="h-full flex flex-col">
                        {isAnalyzing ? (
                           <TacticalLoader type="DIET" title="正在進行多重光譜辨識" />
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center py-12 space-y-10">
                              <div onClick={() => fileInputRef.current?.click()} className="w-64 h-64 border-2 border-dashed border-zinc-100 hover:border-black hover:bg-white transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group rounded-sm">
                                 <div className="w-16 h-16 bg-black text-[#bef264] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Camera size={32} /></div>
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center px-6">上傳補給單位影像<br/>(AI 將自動估算數據)</p>
                              </div>
                              <input type="file" ref={fileInputRef} onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (!file) return;
                                 setIsAnalyzing(true);
                                 try {
                                    const base64 = await compressAndResizeImage(file);
                                    const results = await analyzeFoodImages([base64], profile);
                                    if (results.length > 0) {
                                       setQuickMealName(results[0].name);
                                       setQuickMacros(results[0].macros);
                                       setEntryTab('QUICK');
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
