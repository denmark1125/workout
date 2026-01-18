
import React, { useState, useMemo } from 'react';
import { DietLog, MealRecord, UserProfile, WorkoutLog, FoodItem } from '../types.ts';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { getTaiwanDate } from '../utils/calculations.ts';
import { FOOD_DATABASE } from '../utils/foodDatabase.ts';
import { Plus, Camera, ChevronLeft, ChevronRight, X, Utensils, Droplets, Beef, Wheat, Sandwich, Moon, Sun, Coffee, Trash2, Search, QrCode, Scale, Store, Sparkles } from 'lucide-react';
import TacticalLoader from './TacticalLoader.tsx';

const MEAL_TYPES = {
  breakfast: { label: '早餐 BREAKFAST', icon: <Coffee size={18}/> },
  lunch: { label: '午餐 LUNCH', icon: <Sun size={18}/> },
  dinner: { label: '晚餐 DINNER', icon: <Utensils size={18}/> },
  snack: { label: '點心 SNACK', icon: <Sandwich size={18}/> },
  nightSnack: { label: '宵夜 NIGHT SNACK', icon: <Moon size={18}/> }
};

const NutritionDeck: React.FC<{ dietLogs: DietLog[]; onUpdateDietLog: (log: DietLog) => void; profile: UserProfile; workoutLogs: WorkoutLog[]; }> = ({ dietLogs = [], onUpdateDietLog, profile }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');
  
  // 狀態整合
  const [newMealName, setNewMealName] = useState('');
  const [newMealSource, setNewMealSource] = useState('');
  const [newMealBarcode, setNewMealBarcode] = useState('');
  const [newMealServings, setNewMealServings] = useState(1);
  const [newMealPortionLabel, setNewMealPortionLabel] = useState('份');
  const [baseMacros, setBaseMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const currentLog = useMemo(() => {
    const log = dietLogs.find(l => l.date === selectedDate);
    const emptyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], nightSnack: [] };
    const baseLog: DietLog = log || { id: selectedDate, date: selectedDate, meals: emptyMeals, waterIntake: 0 };
    return { ...baseLog, meals: baseLog.meals || emptyMeals };
  }, [dietLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    (Object.values(currentLog.meals) as MealRecord[][]).forEach((mealList) => {
      mealList.forEach((m: MealRecord) => {
        totals.calories += Number(m.macros.calories || 0);
        totals.protein += Number(m.macros.protein || 0);
        totals.carbs += Number(m.macros.carbs || 0);
        totals.fat += Number(m.macros.fat || 0);
      });
    });
    return totals;
  }, [currentLog]);

  const filteredFoodDb = useMemo(() => {
    if (!searchQuery) return [];
    return FOOD_DATABASE.filter(f => f.name.includes(searchQuery)).slice(0, 5);
  }, [searchQuery]);

  const handleSelectFood = (food: FoodItem) => {
    setNewMealName(food.name);
    setBaseMacros({
      calories: food.macros.calories.toString(),
      protein: food.macros.protein.toString(),
      carbs: food.macros.carbs.toString(),
      fat: food.macros.fat.toString()
    });
    setNewMealPortionLabel(food.unit.includes('克') ? '克' : '份');
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await analyzeFoodImage(base64, profile);
          if (result) {
            setNewMealName(result.name);
            setBaseMacros({
              calories: result.macros.calories.toString(),
              protein: result.macros.protein.toString(),
              carbs: result.macros.carbs.toString(),
              fat: result.macros.fat.toString()
            });
          }
        } catch (e) {
          alert("AI 辨識模組通訊異常");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMeal = () => {
    if (!newMealName) return;
    const s = Number(newMealServings) || 1;
    const newMeal: MealRecord = {
      id: Date.now().toString(),
      name: newMealName,
      timestamp: new Date().toISOString(),
      servings: s,
      portionLabel: newMealPortionLabel,
      macros: { 
        calories: Math.round((parseInt(baseMacros.calories) || 0) * s), 
        protein: Math.round((parseFloat(baseMacros.protein) || 0) * s), 
        carbs: Math.round((parseFloat(baseMacros.carbs) || 0) * s), 
        fat: Math.round((parseFloat(baseMacros.fat) || 0) * s) 
      }
    };
    const updatedLog: DietLog = {
      ...currentLog,
      meals: { ...currentLog.meals, [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal] }
    };
    onUpdateDietLog(updatedLog);
    setShowAddModal(false);
    setNewMealName(''); setBaseMacros({ calories:'', protein:'', carbs:'', fat:'' }); setNewMealServings(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-40 px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-black pb-6 gap-6">
        <div>
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">Nutrition Protocol</p>
          <h2 className="text-3xl font-black text-black tracking-tighter uppercase leading-none">飲食控制</h2>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-sm border border-gray-100">
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 hover:bg-white rounded-sm transition-all bg-white"><ChevronLeft size={16}/></button>
           <span className="font-bold text-xs min-w-[100px] text-center">{selectedDate}</span>
           <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-1.5 hover:bg-white rounded-sm transition-all bg-white"><ChevronRight size={16}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-black text-white p-8 shadow-lg space-y-4 rounded-sm relative overflow-hidden">
            <p className="text-[9px] font-bold text-[#bef264] uppercase tracking-widest">CALORIE BALANCE</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tighter">
                {Math.max(0, (profile.dailyCalorieTarget || 2200) - dailyTotals.calories)}
              </span>
              <span className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">KCAL REMAINING</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-[#bef264]" style={{ width: `${Math.min(100, (dailyTotals.calories / (profile.dailyCalorieTarget || 2200)) * 100)}%` }}></div>
            </div>
         </div>
         <div className="grid grid-cols-3 gap-3">
            {[
              { label: '蛋白質', value: `${dailyTotals.protein}g`, icon: <Beef size={18}/>, color: 'text-orange-500' },
              { label: '碳水', value: `${dailyTotals.carbs}g`, icon: <Wheat size={18}/>, color: 'text-blue-500' },
              { label: '脂肪', value: `${dailyTotals.fat}g`, icon: <Droplets size={18}/>, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-100 p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-black transition-all rounded-sm">
                 <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                 <span className="text-lg font-black text-black">{stat.value}</span>
                 <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">{stat.label}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="space-y-3">
        {Object.entries(MEAL_TYPES).map(([type, meta]) => {
          const mealList = currentLog.meals[type as keyof typeof currentLog.meals] || [];
          const mealCalories = mealList.reduce((s, m) => s + (m.macros.calories || 0), 0);
          return (
            <div key={type} className="bg-white border border-gray-100 rounded-sm shadow-sm hover:border-black transition-all overflow-hidden">
               <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-gray-50 text-black rounded-full group-hover:bg-[#bef264] transition-colors">{meta.icon}</div>
                     <div>
                       <h4 className="text-xs font-bold text-black tracking-tight">{meta.label}</h4>
                       <p className="text-[8px] text-gray-400 font-bold mt-0.5 tracking-widest">{mealCalories} KCAL</p>
                     </div>
                  </div>
                  <button onClick={() => { setActiveMealType(type as any); setShowAddModal(true); }} className="w-8 h-8 flex items-center justify-center bg-black text-white hover:bg-[#bef264] hover:text-black rounded-full transition-all active:scale-90"><Plus size={18} /></button>
               </div>
               {mealList.length > 0 && (
                  <div className="bg-gray-50/50 border-t border-gray-50 px-4 py-2">
                     {mealList.map(meal => (
                       <div key={meal.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100 group">
                          <div className="flex items-center gap-3">
                             <p className="text-xs font-bold text-gray-800">{meal.name} <span className="text-gray-400 text-[9px] italic ml-1">x {meal.servings} {meal.portionLabel}</span></p>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-black">{meal.macros.calories} kcal</span>
                             <button onClick={() => { const updatedLog = { ...currentLog, meals: { ...currentLog.meals, [type]: mealList.filter(m => m.id !== meal.id) } }; onUpdateDietLog(updatedLog); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl border border-black p-8 space-y-8 animate-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-300 hover:text-black transition-colors"><X size={20}/></button>
              
              <div className="space-y-1 border-b border-gray-100 pb-3 text-center">
                 <p className="text-[9px] font-bold text-lime-600 uppercase tracking-[0.3em]">Supply Mission</p>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-black">新增補給任務</h2>
              </div>

              {isAnalyzing ? <TacticalLoader type="DIET" title="David 正在辨識食物矩陣" /> : <div className="space-y-6">
                
                {/* 路徑 A：手動輸入與搜尋資料庫整合 */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 mb-1">
                      <Search size={12} className="text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">路徑 A：搜尋或手動輸入 SEARCH_OR_MANUAL</span>
                   </div>
                   <div className="relative">
                      <input 
                        value={newMealName} 
                        onChange={e => { setNewMealName(e.target.value); setSearchQuery(e.target.value); setShowSearchResults(true); }} 
                        placeholder="輸入食物名稱 (如：雞胸肉)" 
                        className="w-full bg-gray-50 p-4 text-base font-bold outline-none border-b-2 border-transparent focus:border-black transition-all" 
                      />
                      {showSearchResults && filteredFoodDb.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl z-20">
                           {filteredFoodDb.map(f => (
                             <button key={f.id} onClick={() => handleSelectFood(f)} className="w-full text-left p-3 hover:bg-gray-50 flex justify-between items-center border-b border-gray-50 last:border-0">
                               <span className="font-bold text-xs">{f.name}</span>
                               <span className="text-[9px] text-gray-400 font-mono uppercase">{f.macros.calories} KCAL / {f.unit}</span>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>
                </div>

                {/* 路徑 B：AI 視覺辨識 */}
                <div className="p-6 bg-gray-50 border border-gray-200 border-dashed rounded-sm flex flex-col items-center justify-center space-y-3 group hover:border-black transition-all cursor-pointer relative overflow-hidden">
                   <div className="flex items-center gap-2 mb-1 self-start">
                      <Camera size={12} className="text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">路徑 B：AI 戰術掃描 TACTICAL_SCAN</span>
                   </div>
                   <label className="w-full h-16 flex flex-col items-center justify-center cursor-pointer">
                      <Sparkles size={24} className="text-gray-300 group-hover:text-black transition-colors mb-1" />
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-black uppercase tracking-widest">點擊啟動視覺辨識模組</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleCapture} />
                   </label>
                </div>

                {/* 份量、單位整合區塊 */}
                <div className="space-y-3">
                   <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">份量與單位配置 PORTION_UNIT</label>
                   <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                      <div className="flex flex-1 bg-gray-50 p-1 rounded-sm gap-1 border border-gray-100">
                         {[
                            {l: '0.5x', v: 0.5}, {l: '1.0x', v: 1.0}, {l: '2.0x', v: 2.0}
                         ].map(p => (
                            <button 
                              key={p.l} 
                              onClick={() => setNewMealServings(p.v)}
                              className={`flex-1 py-2 text-[9px] font-bold transition-all ${newMealServings === p.v ? 'bg-black text-[#bef264] shadow-sm' : 'text-gray-400 hover:text-black'}`}
                            >
                               {p.l}
                            </button>
                         ))}
                      </div>
                      <div className="flex flex-1 gap-2">
                         <input 
                           type="number" step="0.1" value={newMealServings} 
                           onChange={e => setNewMealServings(parseFloat(e.target.value) || 0)} 
                           className="w-16 bg-gray-50 p-2 text-center font-black text-base outline-none border-b border-transparent focus:border-black"
                         />
                         <select value={newMealPortionLabel} onChange={e => setNewMealPortionLabel(e.target.value)} className="flex-1 bg-gray-50 p-2 text-[10px] font-bold outline-none border-b border-transparent focus:border-black">
                            <option value="份">份 SERVINGS</option>
                            <option value="克">克 GRAMS</option>
                            <option value="顆">顆 PIECES</option>
                            <option value="碗">碗 BOWL</option>
                         </select>
                      </div>
                   </div>
                </div>

                {/* 營養素細節 - 微調比例 */}
                <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                   {[
                     {l:'KCAL', v:baseMacros.calories, s:(val:string)=>setBaseMacros({...baseMacros, calories:val}), c:'text-black'},
                     {l:'P', v:baseMacros.protein, s:(val:string)=>setBaseMacros({...baseMacros, protein:val}), c:'text-orange-500'},
                     {l:'C', v:baseMacros.carbs, s:(val:string)=>setBaseMacros({...baseMacros, carbs:val}), c:'text-blue-500'},
                     {l:'F', v:baseMacros.fat, s:(val:string)=>setBaseMacros({...baseMacros, fat:val}), c:'text-yellow-500'}
                   ].map(f => (
                     <div key={f.l} className="space-y-1 text-center">
                       <label className={`text-[8px] font-bold uppercase tracking-widest ${f.c}`}>{f.l}</label>
                       <input type="number" step="0.1" value={f.v} onChange={e => f.s(e.target.value)} className="w-full bg-gray-50 p-2 text-center font-mono font-bold text-base outline-none border-b-2 border-transparent focus:border-black" />
                       <p className="text-[8px] text-gray-300 font-bold uppercase">Net: {Math.round((parseFloat(f.v)||0) * newMealServings)}</p>
                     </div>
                   ))}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center gap-2 bg-gray-50/50 p-2.5 border border-gray-100 text-gray-400 rounded-sm">
                     <Store size={12} />
                     <input placeholder="來源 (如全家)" value={newMealSource} onChange={e => setNewMealSource(e.target.value)} className="bg-transparent flex-1 text-[9px] font-bold outline-none" />
                   </div>
                   <div className="flex items-center gap-2 bg-gray-50/50 p-2.5 border border-gray-100 text-gray-400 rounded-sm">
                     <QrCode size={12} />
                     <input placeholder="條碼 BARCODE" value={newMealBarcode} onChange={e => setNewMealBarcode(e.target.value)} className="bg-transparent flex-1 text-[9px] font-mono font-bold outline-none" />
                   </div>
                </div>

                <button onClick={handleSaveMeal} disabled={!newMealName} className="w-full bg-black text-[#bef264] py-4 font-bold text-[11px] tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-xl disabled:opacity-20 flex items-center justify-center gap-3 rounded-sm">
                  <Scale size={16} /> 戰略封存 SAVE MEAL
                </button>
              </div>}
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDeck;
